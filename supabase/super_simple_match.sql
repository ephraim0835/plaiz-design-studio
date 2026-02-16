-- SUPER SIMPLE MATCHING: NO CRASHES
-- This version purely finds a worker and returns the ID. No logging, no messages, no drama.

-- 1. KILL ALL VERSIONS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'match_worker_to_project') LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 2. CREATE PURE MATCHING FUNCTION (V9.0)
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT,
    p_budget NUMERIC DEFAULT 0,
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
BEGIN
    -- Step A: Normalize input
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

    -- Step B: Find Best Worker
    SELECT p.id INTO v_worker_id
    FROM public.profiles p
    WHERE 
        -- Skill/Role check
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR v_normalized_skill = ANY(COALESCE(p.skills, '{}')))
        AND p.role NOT IN ('client', 'admin')
        -- Basic Readiness
        AND p.is_active = true
    ORDER BY RANDOM()
    LIMIT 1;

    -- Step C: If project_id is passed, update it (Minimal side effect)
    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;
    ELSIF v_worker_id IS NULL AND p_project_id IS NOT NULL THEN
        UPDATE projects SET status = 'queued' WHERE id = p_project_id;
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 3. PERMISSIONS
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO anon;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO service_role;
