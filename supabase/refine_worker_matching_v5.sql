-- REFINED WORKER MATCHING SYSTEM (V5.2)
-- More resilient skill matching and granular failure tracking

-- 1. Ensure Infrastructure (Updated for better columns)
CREATE TABLE IF NOT EXISTS public.assignment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_reason TEXT,
    effective_count NUMERIC,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignment_logs ADD COLUMN IF NOT EXISTS match_reason TEXT;
ALTER TABLE public.assignment_logs ADD COLUMN IF NOT EXISTS effective_count NUMERIC;
ALTER TABLE public.assignment_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- 2. Repair Profiles Table (Add missing columns for matching & profiles)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS minimum_price NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Enhanced Matching Function
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT,
    p_budget NUMERIC,
    p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_normalized_skill TEXT;
    v_role_alias TEXT;
    v_effective_count NUMERIC;
    v_client_id UUID;
    v_project_title TEXT;
    
    -- Diagnostic Counts
    v_count_all_workers INTEGER;
    v_count_skill_match INTEGER;
    v_count_active INTEGER;
    v_count_available INTEGER;
    v_count_verified_bank INTEGER;
    v_count_budget_match INTEGER;
    v_count_capacity INTEGER;
BEGIN
    -- STEP 1: Fetch Project Details if ID provided
    IF p_project_id IS NOT NULL THEN
        SELECT client_id, title INTO v_client_id, v_project_title FROM projects WHERE id = p_project_id;
    ELSE
        v_project_title := 'New Project (Uncreated)';
    END IF;

    -- STEP 2: Normalize skill names
    v_normalized_skill := CASE 
        WHEN p_skill IN ('graphic_design', 'logo_design', 'branding', 'graphics', 'graphic designer') THEN 'graphics'
        WHEN p_skill IN ('web_design', 'website', 'web_development', 'web', 'web designer') THEN 'web'
        WHEN p_skill IN ('printing', 'print', 'merchandise', 'printing_services', 'print specialist') THEN 'printing'
        ELSE p_skill
    END;

    -- STEP 3: Map to Profile Roles
    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- STEP 4: Attempt to Find Best Worker
    SELECT p.id, 
           (CASE 
                WHEN wr.assignment_count IS NULL THEN 1  -- New worker baseline
                ELSE wr.assignment_count 
            END) 
    INTO v_worker_id, v_effective_count
    FROM profiles p
    LEFT JOIN worker_rotation wr ON wr.worker_id = p.id AND wr.skill = v_normalized_skill
    LEFT JOIN worker_stats ws ON ws.worker_id = p.id
    LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
    WHERE 
        -- Resilient Skill/Role Match
        (
            p.skill = v_normalized_skill 
            OR p.role = v_role_alias 
            OR p.role = p_skill 
            OR p.skill = p_skill
            OR v_normalized_skill = ANY(p.skills) -- Check skills array if exists
            OR p_skill = ANY(p.skills)
        )
        AND p.role NOT IN ('client', 'admin')
        
        -- Eligibility Guards
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true -- Required for payouts
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY 
        -- Fair Rotation Priority:
        (CASE WHEN wr.assignment_count IS NULL THEN 1 ELSE wr.assignment_count END) ASC,
        COALESCE(wr.last_assigned_at, '1970-01-01'::timestamptz) ASC,
        RANDOM()
    LIMIT 1;
    
    -- STEP 5: Detailed Diagnostics if match fails
    IF v_worker_id IS NULL THEN
        -- Run specific funnel diagnostics
        SELECT COUNT(*) INTO v_count_all_workers FROM profiles WHERE role NOT IN ('client', 'admin');
        
        -- Funnel 1: Skill Match
        SELECT COUNT(*) INTO v_count_skill_match FROM profiles WHERE role NOT IN ('client', 'admin') 
        AND (skill = v_normalized_skill OR role = v_role_alias OR role = p_skill OR skill = p_skill OR v_normalized_skill = ANY(skills) OR p_skill = ANY(skills));

        -- Funnel 2: Active & Available
        SELECT COUNT(*) INTO v_count_available FROM profiles WHERE role NOT IN ('client', 'admin')
        AND (skill = v_normalized_skill OR role = v_role_alias OR role = p_skill OR skill = p_skill OR v_normalized_skill = ANY(skills) OR p_skill = ANY(skills))
        AND is_active = true AND COALESCE(is_available, true) = true;

        -- Funnel 3: Verified Bank
        SELECT COUNT(*) INTO v_count_verified_bank FROM profiles p LEFT JOIN bank_accounts ba ON ba.worker_id = p.id 
        WHERE p.role NOT IN ('client', 'admin')
        AND (p.skill = v_normalized_skill OR p.role = v_role_alias OR p.role = p_skill OR p.skill = p_skill OR v_normalized_skill = ANY(p.skills) OR p_skill = ANY(p.skills))
        AND p.is_active = true AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true;

        -- Funnel 4: Budget Match
        SELECT COUNT(*) INTO v_count_budget_match FROM profiles p LEFT JOIN bank_accounts ba ON ba.worker_id = p.id 
        WHERE p.role NOT IN ('client', 'admin')
        AND (p.skill = v_normalized_skill OR p.role = v_role_alias OR p.role = p_skill OR p.skill = p_skill OR v_normalized_skill = ANY(p.skills) OR p_skill = ANY(p.skills))
        AND p.is_active = true AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget);

        -- Log failure with detailed funnel
        IF p_project_id IS NOT NULL THEN
            UPDATE projects SET status = 'queued' WHERE id = p_project_id;

            INSERT INTO assignment_logs (project_id, match_reason, details)
            VALUES (
                p_project_id,
                'MATCH_FAILED',
                jsonb_build_object(
                    'funnel', jsonb_build_object(
                        '1_total_workers', v_count_all_workers,
                        '2_skill_matches', v_count_skill_match,
                        '3_available_workers', v_count_available,
                        '4_verified_bank_workers', v_count_verified_bank,
                        '5_budget_matches', v_count_budget_match
                    ),
                    'params', jsonb_build_object(
                        'searched_skill', v_normalized_skill,
                        'searched_role', v_role_alias,
                        'budget', p_budget
                    )
                )
            );
        END IF;
        RETURN NULL;
    END IF;

    -- STEP 6: Execution (Match found)
    IF p_project_id IS NOT NULL THEN
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;

        INSERT INTO worker_rotation (skill, worker_id, last_assigned_at, assignment_count)
        VALUES (v_normalized_skill, v_worker_id, NOW(), 1)
        ON CONFLICT (worker_id, skill) 
        DO UPDATE SET last_assigned_at = NOW(), assignment_count = worker_rotation.assignment_count + 1;

        INSERT INTO messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'Hello! I am ready to work on "' || v_project_title || '".');

        INSERT INTO assignment_logs (project_id, worker_id, effective_count, match_reason)
        VALUES (p_project_id, v_worker_id, v_effective_count, 'SUCCESS: Fair rotation match');
    END IF;
    
    RETURN v_worker_id;
END;
$$;
