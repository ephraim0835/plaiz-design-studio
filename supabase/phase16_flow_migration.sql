-- Phase 16: End-to-End Project Flow Logic
-- 1. Standards for Pricing Proposals (Agreements)
ALTER TABLE public.agreements ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Enhanced Project Tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_price NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payout_split_done BOOLEAN DEFAULT false;

-- Update status constraint (Check if it's an enum or text check)
DO $$ 
BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
    CHECK (status IN ('queued', 'assigned', 'pending_agreement', 'waiting_payment', 'in_progress', 'under_review', 'revision_requested', 'completed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed, might be using an ENUM: %', SQLERRM;
END $$;

-- 3. Strict Worker Selection Logic (Verified bank needed)
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_project_id UUID,
    p_skill TEXT,
    p_budget NUMERIC
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
BEGIN
    -- STEP 1: Fetch Project Details 
    SELECT client_id, title INTO v_client_id, v_project_title FROM projects WHERE id = p_project_id;
    IF v_client_id IS NULL THEN RETURN NULL; END IF;

    -- STEP 2: Normalize skill names
    v_normalized_skill := CASE 
        WHEN p_skill IN ('graphic_design', 'logo_design', 'branding', 'graphics') THEN 'graphics'
        WHEN p_skill IN ('web_design', 'website', 'web_development', 'web') THEN 'web'
        WHEN p_skill IN ('printing', 'print', 'merchandise', 'printing_services') THEN 'printing'
        ELSE p_skill
    END;

    -- STEP 3: Map to Profile Roles
    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- STEP 4: Finding Best Worker
    -- !!! MANDATORY: ba.is_verified = true !!!
    SELECT p.id, COALESCE(wr.assignment_count, 0)
    INTO v_worker_id, v_effective_count
    FROM profiles p
    JOIN bank_accounts ba ON ba.worker_id = p.id -- MUST HAVE BANK ACCOUNT
    LEFT JOIN worker_rotation wr ON wr.worker_id = p.id AND wr.skill = v_normalized_skill
    LEFT JOIN worker_stats ws ON ws.worker_id = p.id
    WHERE 
        -- Skill/Role Match
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR p.role = p_skill)
        AND p.role NOT IN ('client', 'admin')
        
        -- Availability & Verification
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        AND ba.is_verified = true -- STRICT REQUIREMENT
        
        -- Budget Check
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        
        -- Capacity Check
        AND COALESCE(ws.is_probation, false) = false
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY 
        (COALESCE(wr.assignment_count, 0)) ASC, -- Fair Rotation
        COALESCE(wr.last_assigned_at, '1970-01-01'::timestamptz) ASC,
        RANDOM()
    LIMIT 1;
    
    -- STEP 5: Assignment Execution
    IF v_worker_id IS NOT NULL THEN
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;

        INSERT INTO worker_rotation (skill, worker_id, last_assigned_at, assignment_count)
        VALUES (v_normalized_skill, v_worker_id, NOW(), 1)
        ON CONFLICT (worker_id, skill) DO UPDATE SET
            last_assigned_at = NOW(),
            assignment_count = worker_rotation.assignment_count + 1;

        INSERT INTO assignment_logs (project_id, worker_id, effective_count, match_reason)
        VALUES (p_project_id, v_worker_id, v_effective_count, 'Match Success (Verified Worker Only)');

        INSERT INTO messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'Hello! I am ready to work on your project "' || v_project_title || '". Let''s discuss the details.');

        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_worker_id, 'New Project!', 'Matched with project: ' || v_project_title, 'project_assigned', p_project_id);
    END IF;
    
    RETURN v_worker_id;
END;
$$;
