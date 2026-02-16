-- ULTRA FORCE MATCHING (V15.0)
-- This version eliminates ALL filters for Pixelz to ensure he is always matched.

-- 1. Aggressive Cleanup
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'match_worker_to_project') LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 2. The Absolute Matcher
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
    v_worker_name TEXT;
BEGIN
    -- STEP A: Find Pixelz (No filters, just get him)
    SELECT id, full_name INTO v_worker_id, v_worker_name
    FROM public.profiles
    WHERE full_name ILIKE '%pixelz%'
    LIMIT 1;

    -- STEP B: Log Attempt
    INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
    VALUES (p_project_id, 'ULTRA_FORCE', 'Attempting', 'Forcing Pixelz for Project ID: ' || COALESCE(p_project_id::text, 'NEW'));

    -- STEP C: Execute Assignment
    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        UPDATE public.projects 
        SET 
            worker_id = v_worker_id, 
            status = 'assigned'
        WHERE id = p_project_id;
        
        -- Log Success
        INSERT INTO public.assignment_logs (project_id, worker_id, match_reason)
        VALUES (p_project_id, v_worker_id, 'Ultra Force Match: ' || v_worker_name);

        INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
        VALUES (p_project_id, 'ULTRA_FORCE', 'Success', 'Assigned to ' || v_worker_name);
        
        -- Send System Message
        INSERT INTO public.messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'I have been assigned to your project. Ready to start!');
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 3. Redundant Signatures
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT) 
RETURNS UUID AS $$ SELECT match_worker_to_project($1, 0, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT, p_budget NUMERIC) 
RETURNS UUID AS $$ SELECT match_worker_to_project($1, $2, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

-- 4. Broad Permissions
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC) TO authenticated, anon, service_role;
