-- MASTER SCHEMA REPAIR & WORKER MATCHING (V5)
-- Resolves: Strict constraints, missing columns, and matching failures.

-- 1. Relax Constraints (Crucial for flexibility)
DO $$ 
BEGIN
    -- Drop skill constraints if they exist
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_skill_check;
    ALTER TABLE public.worker_rotation DROP CONSTRAINT IF EXISTS worker_rotation_skill_check;
    
    -- Ensure columns exist
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    
    -- Ensure notifications table and column exist
    CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT,
        project_id UUID,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS project_id UUID;
END $$;

-- 2. Infrastructure Tables
CREATE TABLE IF NOT EXISTS public.worker_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    average_rating NUMERIC DEFAULT 5.0,
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    max_projects_limit INTEGER DEFAULT 5,
    is_probation BOOLEAN DEFAULT false,
    skills TEXT[] DEFAULT '{}',
    last_assignment_at TIMESTAMPTZ,
    idle_since TIMESTAMPTZ DEFAULT NOW(),
    pricing_tier TEXT DEFAULT 'junior' CHECK (pricing_tier IN ('junior', 'senior', 'elite')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id)
);

CREATE TABLE IF NOT EXISTS public.worker_rotation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill TEXT NOT NULL,
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assignment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, skill)
);

CREATE TABLE IF NOT EXISTS public.assignment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_reason TEXT,
    effective_count NUMERIC,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Robust Matching Function V5
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
    -- Safety check: ensure project exists
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
    -- Logic: Fair Rotation + Availability + Verified Bank (if exists any)
    SELECT p.id, (COALESCE(wr.assignment_count, 0) + CASE WHEN wr.assignment_count IS NULL THEN 1 ELSE 0 END) 
    INTO v_worker_id, v_effective_count
    FROM profiles p
    LEFT JOIN worker_rotation wr ON wr.worker_id = p.id AND wr.skill = v_normalized_skill
    LEFT JOIN worker_stats ws ON ws.worker_id = p.id
    LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
    WHERE 
        -- Skill/Role Match
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR p.role = p_skill)
        AND p.role NOT IN ('client', 'admin')
        
        -- Availability
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        
        -- Payout Availability (Relaxed: allow matching if no one is verified, but prioritize verified)
        -- AND COALESCE(ba.is_verified, false) = true -- Keep strict if required, or relax with a fallback
        
        -- Budget Check
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        
        -- Capacity Check
        AND COALESCE(ws.is_probation, false) = false
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY 
        COALESCE(ba.is_verified, false) DESC, -- Prioritize verified workers
        (COALESCE(wr.assignment_count, 0) + CASE WHEN wr.assignment_count IS NULL THEN 1 ELSE 0 END) ASC, -- Fair Rotation
        COALESCE(wr.last_assigned_at, '1970-01-01'::timestamptz) ASC,
        RANDOM()
    LIMIT 1;
    
    -- STEP 5: Assignment Execution
    IF v_worker_id IS NOT NULL THEN
        -- 5.1 Assign project
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;

        -- 5.2 Update rotation
        INSERT INTO worker_rotation (skill, worker_id, last_assigned_at, assignment_count)
        VALUES (v_normalized_skill, v_worker_id, NOW(), 1)
        ON CONFLICT (worker_id, skill) DO UPDATE SET
            last_assigned_at = NOW(),
            assignment_count = worker_rotation.assignment_count + 1;

        -- 5.3 Auditor log
        INSERT INTO assignment_logs (project_id, worker_id, effective_count, match_reason)
        VALUES (p_project_id, v_worker_id, v_effective_count, 'Match Success (Fair Rotation)');

        -- 5.4 Engage (Message)
        INSERT INTO messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'Hello! I am ready to work on your project "' || v_project_title || '". Let''s discuss the details.');

        -- 5.5 Notify
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_worker_id, 'New Project!', 'Matched with project: ' || v_project_title, 'project_assigned', p_project_id);

    ELSE
        -- Log failure reason
        INSERT INTO assignment_logs (project_id, match_reason, details)
        VALUES (p_project_id, 'MATCH_FAILED', jsonb_build_object(
            'skill', v_normalized_skill,
            'role', v_role_alias,
            'workers_in_pool', (SELECT COUNT(*) FROM profiles WHERE role NOT IN ('client', 'admin')),
            'available_in_category', (SELECT COUNT(*) FROM profiles WHERE (skill = v_normalized_skill OR role = v_role_alias) AND is_active = true)
        ));
    END IF;
    
    RETURN v_worker_id;
END;
$$;

-- 4. Initial Bootstrap (Optional: ensures system has life)
INSERT INTO worker_stats (worker_id, average_rating, total_projects, active_projects)
SELECT id, 5.0, 0, 0
FROM profiles 
WHERE role NOT IN ('client', 'admin')
ON CONFLICT (worker_id) DO NOTHING;
