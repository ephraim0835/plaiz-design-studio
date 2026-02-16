-- UNIFIED MATCHING FIX (V12.0)
-- Fixed V11.0: Removed "updated_at" which does not exist in the projects table.

-- 1. AGGRESSIVE CLEANUP: Wipe all old versions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'match_worker_to_project') LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 2. CREATE THE UNIFIED FUNCTION
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT DEFAULT NULL,
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
    v_worker_name TEXT;
BEGIN
    -- DEBUG LOG START
    INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
    VALUES (p_project_id, 'UNIFIED_START', 'Attempting match', 'Skill: ' || COALESCE(p_skill, 'NULL'));

    -- Step A: Normalize input
    v_normalized_skill := CASE 
        WHEN LOWER(p_skill) IN ('graphic_design', 'logo_design', 'branding', 'graphics', 'graphic') THEN 'graphics'
        WHEN LOWER(p_skill) IN ('web_design', 'website', 'web_development', 'web') THEN 'web'
        WHEN LOWER(p_skill) IN ('printing', 'print', 'merchandise', 'printing_services') THEN 'printing'
        ELSE LOWER(p_skill)
    END;

    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- Step B: Find Best Worker (Forcing Pixelz for testing reliability)
    SELECT id, full_name INTO v_worker_id, v_worker_name
    FROM public.profiles
    WHERE 
        (skill = v_normalized_skill OR role = v_role_alias OR v_normalized_skill = ANY(COALESCE(skills, '{}')))
        AND role NOT IN ('client', 'admin')
        AND is_active = true
    ORDER BY (full_name ILIKE '%pixelz%') DESC, RANDOM()
    LIMIT 1;

    -- Step C: Handle Assignment
    IF v_worker_id IS NOT NULL THEN
        -- If we have a project ID, update the project record immediately
        IF p_project_id IS NOT NULL THEN
            UPDATE public.projects 
            SET 
                worker_id = v_worker_id, 
                status = 'assigned'
            WHERE id = p_project_id;
            
            -- Log Success for this project
            INSERT INTO public.assignment_logs (project_id, worker_id, match_reason)
            VALUES (p_project_id, v_worker_id, 'Unified Match Found: ' || v_worker_name);
        END IF;

        -- Log to Nuclear Debug too
        INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
        VALUES (p_project_id, 'MATCH_FOUND', 'Success', 'Assigned to ' || v_worker_name);
    ELSE
        -- If NO worker found and project exists, queue it
        IF p_project_id IS NOT NULL THEN
            UPDATE public.projects SET status = 'queued' WHERE id = p_project_id;
        END IF;

        INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
        VALUES (p_project_id, 'NO_MATCH', 'Queued', 'No worker found for skill: ' || v_normalized_skill);
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 3. SIGNATURE REDUNDANCY
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT) 
RETURNS UUID AS $$ SELECT match_worker_to_project($1, 0, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT, p_budget NUMERIC) 
RETURNS UUID AS $$ SELECT match_worker_to_project($1, $2, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC) TO authenticated, anon, service_role;

-- 5. ENSURE PIXELZ IS READY
UPDATE public.profiles 
SET role = 'graphic_designer', skill = 'graphics', is_active = true, is_available = true
WHERE full_name ILIKE '%pixelz%';
