-- NUCLEAR DIAGNOSTIC: FIND THE BOTTLENECK
-- This script creates a debug log table and a diagnostic version of the matching function.

-- 1. Create Debug Table
CREATE TABLE IF NOT EXISTS public.debug_matching_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    searched_skill TEXT,
    worker_id UUID,
    worker_name TEXT,
    step TEXT,
    is_met BOOLEAN,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE DIAGNOSTIC MATCHING FUNCTION (V7.0)
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
    v_project_title TEXT;
    
    -- Diagnostic cursors
    rec RECORD;
BEGIN
    -- Step 1: Normalize
    v_normalized_skill := CASE 
        WHEN p_skill IN ('graphic_design', 'logo_design', 'branding', 'graphics') THEN 'graphics'
        WHEN p_skill IN ('web_design', 'website', 'web_development', 'web') THEN 'web'
        WHEN p_skill IN ('printing', 'print', 'merchandise', 'printing_services') THEN 'printing'
        ELSE p_skill
    END;

    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- Step 2: Diagnostic Loop (Check EVERY potentially matching worker)
    FOR rec IN (
        SELECT 
            p.id, p.full_name, p.role, p.skill, p.is_active, p.is_available, p.minimum_price, p.skills,
            ba.is_verified, ws.active_projects, ws.max_projects_limit
        FROM public.profiles p
        LEFT JOIN public.bank_accounts ba ON ba.worker_id = p.id
        LEFT JOIN public.worker_stats ws ON ws.worker_id = p.id
        WHERE p.role NOT IN ('client', 'admin')
    ) LOOP
        -- Check Role/Skill Match
        INSERT INTO debug_matching_logs (project_id, searched_skill, worker_id, worker_name, step, is_met, details)
        VALUES (p_project_id, v_normalized_skill, rec.id, rec.full_name, '1. Skill Match', 
               (rec.skill = v_normalized_skill OR rec.role = v_role_alias OR v_normalized_skill = ANY(COALESCE(rec.skills, '{}'))),
               'Worker Skill: ' || COALESCE(rec.skill, 'NULL') || ', Role: ' || rec.role);

        -- Check Active/Available
        INSERT INTO debug_matching_logs (project_id, searched_skill, worker_id, worker_name, step, is_met, details)
        VALUES (p_project_id, v_normalized_skill, rec.id, rec.full_name, '2. Availability', 
               (rec.is_active AND COALESCE(rec.is_available, true)),
               'Active: ' || rec.is_active || ', Available: ' || COALESCE(rec.is_available, true));

        -- Check Bank
        INSERT INTO debug_matching_logs (project_id, searched_skill, worker_id, worker_name, step, is_met, details)
        VALUES (p_project_id, v_normalized_skill, rec.id, rec.full_name, '3. Bank Verified', 
               COALESCE(rec.is_verified, false),
               'Verified: ' || COALESCE(rec.is_verified, false));

        -- Check Budget
        INSERT INTO debug_matching_logs (project_id, searched_skill, worker_id, worker_name, step, is_met, details)
        VALUES (p_project_id, v_normalized_skill, rec.id, rec.full_name, '4. Budget Capacity', 
               (p_budget = 0 OR p_budget IS NULL OR COALESCE(rec.minimum_price, 0) <= p_budget),
               'Worker Price: ' || COALESCE(rec.minimum_price, 0) || ', Project Budget: ' || p_budget);
               
        -- Check Capacity
        INSERT INTO debug_matching_logs (project_id, searched_skill, worker_id, worker_name, step, is_met, details)
        VALUES (p_project_id, v_normalized_skill, rec.id, rec.full_name, '5. Workload', 
               (COALESCE(rec.active_projects, 0) < COALESCE(rec.max_projects_limit, 5)),
               'Active: ' || COALESCE(rec.active_projects, 0) || ', Limit: ' || COALESCE(rec.max_projects_limit, 5));
    END LOOP;

    -- Step 3: Run the actual query to get the winner
    SELECT p.id INTO v_worker_id
    FROM public.profiles p
    LEFT JOIN public.bank_accounts ba ON ba.worker_id = p.id
    LEFT JOIN public.worker_stats ws ON ws.worker_id = p.id
    WHERE 
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR v_normalized_skill = ANY(COALESCE(p.skills, '{}')))
        AND p.role NOT IN ('client', 'admin')
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY RANDOM()
    LIMIT 1;

    -- Step 4: Handle Assignment
    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        SELECT title INTO v_project_title FROM projects WHERE id = p_project_id;
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;
        INSERT INTO messages (project_id, sender_id, content) VALUES (p_project_id, v_worker_id, 'Hello! I been assigned to your project.');
    ELSIF v_worker_id IS NULL AND p_project_id IS NOT NULL THEN
        UPDATE projects SET status = 'queued' WHERE id = p_project_id;
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 5. Final Permission Grant
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO anon;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO service_role;
