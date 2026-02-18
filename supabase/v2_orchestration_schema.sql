-- ====================================================================
-- ANTIGRAVITY ORCHESTRATION - V2 REBUILD SCHEMA
-- Version: 2.0 (Nuclear Rebuild)
-- ====================================================================

-- 1. WORKER VERIFICATION SYSTEM
-- Add binary verification gate
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING' 
CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'));

-- Verification Audit Log
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id),
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECT SCHEMA REFINEMENT (V2)
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'matching',               -- AI is classifying/searching
    'assigned',               -- Best worker selected, waiting for ACCEPTANCE
    'waiting_for_client',    -- Worker accepted, submitted price proposal
    'awaiting_down_payment', -- Client accepted proposal
    'work_started',          -- 40% Deposit paid (Work officially begins)
    'review_samples',        -- Worker uploaded previews
    'awaiting_final_payment',-- Client approved samples
    'completed',             -- Final payment done & Payout marked "PAID"
    'NO_WORKER_AVAILABLE',   -- Hard fail state if no expert exists
    'cancelled',
    'flagged',
    'stuck_in_negotiation'
));

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS assignment_deadline TIMESTAMPTZ, -- 1-hour window
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. WORKER MATCHING ENGINE (V2)
-- Strict rules: Must be VERIFIED, Must be matches classified role.
CREATE OR REPLACE FUNCTION match_worker_v2(
    p_project_id UUID,
    p_role TEXT, -- classified role
    p_skill_relevance TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_client_id UUID;
BEGIN
    SELECT client_id INTO v_client_id FROM projects WHERE id = p_project_id;

    WITH worker_pool AS (
        SELECT 
            p.id,
            -- Scoring logic
            ((CASE WHEN p.skill = ANY(p_skill_relevance) THEN 1.0 ELSE 0.0 END) * 0.40 +
             (COALESCE(ws.average_rating, 5.0) / 5.0) * 0.25 +
             (LEAST(COALESCE(ws.completed_projects, 0) / 20.0, 1.0)) * 0.10 +
             (1.0 - (COALESCE(ws.active_projects, 0)::NUMERIC / COALESCE(ws.max_projects_limit, 5)::NUMERIC)) * 0.25) as score
        FROM profiles p
        LEFT JOIN worker_stats ws ON ws.worker_id = p.id
        WHERE 
            p.role = p_role -- HARD ROLE MATCH
            AND p.verification_status = 'VERIFIED' -- HARD VERIFICATION GATE
            AND COALESCE(p.is_available, true) = true
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
            AND p.id != v_client_id -- Self-assignment prevention
    )
    SELECT id INTO v_worker_id 
    FROM worker_pool 
    ORDER BY score DESC 
    LIMIT 1;

    IF v_worker_id IS NOT NULL THEN
        UPDATE projects 
        SET worker_id = v_worker_id, 
            status = 'assigned',
            assignment_deadline = NOW() + INTERVAL '1 hour'
        WHERE id = p_project_id;

        -- Notify Worker
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_worker_id, 'New Project Opportunity!', 'You have 1 hour to accept this project before it is reassigned.', 'project_assigned', p_project_id);
    ELSE
        -- NO QUEUE RULE
        UPDATE projects SET status = 'NO_WORKER_AVAILABLE' WHERE id = p_project_id;
        
        -- Notify Client
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_client_id, 'No Experts Available', 'Currently, no available ' || p_role || ' can take this project. Please try again later.', 'matching_failed', p_project_id);
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 4. V2 PAYOUT CALCULATION (70/30 Digital, 10% Profit Printing)
CREATE OR REPLACE FUNCTION calculate_v2_splits(p_total NUMERIC, p_type TEXT, p_profit NUMERIC DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_worker_share NUMERIC;
    v_platform_share NUMERIC;
BEGIN
    IF p_type = 'Printing' OR p_type = 'print_specialist' THEN
        -- Platform takes 10% of worker's profit
        v_platform_share := COALESCE(p_profit, 0) * 0.10;
        v_worker_share := p_total - v_platform_share;
    ELSE
        -- Standard 70/30 Digital Split (30% to platform)
        v_platform_share := p_total * 0.30;
        v_worker_share := p_total * 0.70;
    END IF;
    
    RETURN jsonb_build_object(
        'worker_share', v_worker_share,
        'platform_share', v_platform_share
    );
END;
$$ LANGUAGE plpgsql;
