-- AI Platform Setup Migration Script
-- Run this in your Supabase SQL Editor

-- 1. Update 'projects' table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS match_score_cache JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS assignment_method TEXT CHECK (assignment_method IN ('ai_auto', 'admin_override', 'manual')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'escrow', 'released'));

-- 2. Update 'worker_stats' table
ALTER TABLE public.worker_stats
ADD COLUMN IF NOT EXISTS last_assignment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS idle_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'junior' CHECK (pricing_tier IN ('junior', 'senior', 'elite'));

-- 3. Function: Calculate Match Score
CREATE OR REPLACE FUNCTION public.calculate_match_score(
    p_worker_id UUID,
    p_service_type TEXT,
    p_required_role TEXT
) RETURNS JSONB AS $$
DECLARE
    v_skill_score INTEGER := 0;
    v_av_score INTEGER := 0;
    v_fairness_score INTEGER := 0;
    v_rating_score INTEGER := 0;
    v_total_score INTEGER;
    v_worker_record RECORD;
    v_rotation_penalty INTEGER := 0;
    v_idle_bonus INTEGER := 0;
    v_active_projects INTEGER;
    v_avg_rating NUMERIC;
BEGIN
    -- Get worker stats
    SELECT * INTO v_worker_record FROM public.worker_stats WHERE worker_id = p_worker_id;
    
    -- basic data
    v_active_projects := COALESCE(v_worker_record.active_projects, 0);
    v_avg_rating := COALESCE(v_worker_record.average_rating, 0);
    
    -- A. Skill Fit (40%) - Simplified for now: 100 if role matches, 0 otherwise
    -- In a real scenario, check tags/skills.
    -- Assuming filtering happens before, we give base score.
    v_skill_score := 100; 

    -- B. Availability (30%)
    IF v_active_projects = 0 THEN
        v_av_score := 100;
    ELSIF v_active_projects < 3 THEN
        v_av_score := 80;
    ELSE
        v_av_score := 20; -- Heavy load penalty
    END IF;

    -- C. Fairness Boost (20%)
    -- 1. Idle Bonus
    IF v_worker_record.active_projects = 0 AND (NOW() - v_worker_record.idle_since) > INTERVAL '7 days' THEN
        v_idle_bonus := 20;
    END IF;
    
    -- 2. Rotation Penalty (Assigned < 24h ago)
    IF (NOW() - v_worker_record.last_assignment_at) < INTERVAL '24 hours' THEN
        v_rotation_penalty := -20;
    END IF;

    v_fairness_score := GREATEST(0, 50 + v_idle_bonus + v_rotation_penalty);

    -- D. Performance (10%)
    -- Normalize 5.0 -> 100
    v_rating_score := (v_avg_rating / 5.0) * 100;

    -- Weighted Sum
    v_total_score := (v_skill_score * 0.40) + (v_av_score * 0.30) + (v_fairness_score * 0.20) + (v_rating_score * 0.10);

    RETURN jsonb_build_object(
        'total', v_total_score,
        'breakdown', jsonb_build_object(
            'skill', v_skill_score,
            'availability', v_av_score,
            'fairness', v_fairness_score,
            'rating', v_rating_score
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Find Best Worker
CREATE OR REPLACE FUNCTION public.find_best_worker(
    p_service_type TEXT,
    p_required_role TEXT
) RETURNS UUID AS $$
DECLARE
    v_worker_id UUID;
    v_best_score INTEGER := -1;
    v_current_score JSONB;
    v_candidate RECORD;
    v_score_val INTEGER;
BEGIN
    -- Iterate over workers with correct role
    FOR v_candidate IN 
        SELECT p.id, p.full_name 
        FROM public.profiles p
        JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE p.role = p_required_role -- e.g 'graphic_designer' matches enum in code
        OR (p.role = 'worker' AND ws.skills ? p_service_type) -- Fallback if using generic role
    LOOP
        -- Calculate Score
        v_current_score := calculate_match_score(v_candidate.id, p_service_type, p_required_role);
        v_score_val := (v_current_score->>'total')::INTEGER;

        -- Update Best
        IF v_score_val > v_best_score THEN
            v_best_score := v_score_val;
            v_worker_id := v_candidate.id;
        END IF;
    END LOOP;

    RETURN v_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
