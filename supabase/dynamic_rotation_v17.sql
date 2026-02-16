-- DYNAMIC ROTATION & FAIR MATCHING (V17.0)
-- 1. Initialize Rotation Table with ALL current workers
-- 2. Deploy Dynamic Matcher (Idle-Longest-First)
-- 3. Automate New Designer Onboarding

-- STEP 1: INITIALIZE ROTATION
-- Ensure every person with a worker skill is in the rotation table
INSERT INTO public.worker_rotation (worker_id, skill)
SELECT id, skill 
FROM public.profiles 
WHERE skill IN ('graphics', 'web', 'printing')
AND role NOT IN ('admin', 'client')
ON CONFLICT (worker_id, skill) DO NOTHING;

-- STEP 2: DYNAMIC MATCHING FUNCTION (V17.0)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'match_worker_to_project') LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

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
    v_normalized_skill TEXT;
    v_role_alias TEXT;
BEGIN
    -- A: Normalize skill
    v_normalized_skill := CASE 
        WHEN LOWER(p_skill) IN ('graphic_design', 'logo_design', 'branding', 'graphics', 'graphic') THEN 'graphics'
        WHEN LOWER(p_skill) IN ('web_design', 'website', 'web_development', 'web') THEN 'web'
        WHEN LOWER(p_skill) IN ('printing', 'print', 'merchandise', 'printing_services') THEN 'printing'
        ELSE LOWER(p_skill)
    END;

    -- B: Find Best Worker (Idle-longest-first within the skill)
    SELECT wr.worker_id, p.full_name INTO v_worker_id, v_worker_name
    FROM public.worker_rotation wr
    JOIN public.profiles p ON p.id = wr.worker_id
    WHERE wr.skill = v_normalized_skill
    AND p.is_active = true
    AND COALESCE(p.is_available, true) = true
    ORDER BY wr.last_assigned_at ASC NULLS FIRST, RANDOM()
    LIMIT 1;

    -- C: Log Attempt
    INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
    VALUES (p_project_id, 'DYNAMIC_ROTATION_V17', 'Found: ' || COALESCE(v_worker_name, 'NONE'), 'Skill: ' || v_normalized_skill);

    -- D: Execute Assignment
    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        -- 1. Update Project Status (Main Goal)
        BEGIN
            UPDATE public.projects 
            SET worker_id = v_worker_id, status = 'assigned' 
            WHERE id = p_project_id;
            
            -- Update Rotation Stats
            UPDATE public.worker_rotation 
            SET last_assigned_at = NOW(), 
                assignment_count = assignment_count + 1 
            WHERE worker_id = v_worker_id AND skill = v_normalized_skill;

        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
            VALUES (p_project_id, 'ASSIGNMENT_ERROR', 'Fail', SQLERRM);
        END;

        -- 2. Send System Message (Nice to have, failsafe)
        BEGIN
            INSERT INTO public.messages (project_id, sender_id, content) 
            VALUES (p_project_id, v_worker_id, 'Hello! I am your designer for this project. Let me know if you have any questions!');
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    RETURN v_worker_id;
END;
$$;

-- Wrapper functions for legacy signatures
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT) RETURNS UUID AS $$ SELECT match_worker_to_project($1, 0, NULL); $$ LANGUAGE SQL SECURITY DEFINER;
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT, p_budget NUMERIC) RETURNS UUID AS $$ SELECT match_worker_to_project($1, $2, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC) TO authenticated, anon, service_role;

-- STEP 3: NEW WORKER AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_worker_rotation_onboard()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role NOT IN ('client', 'admin') AND NEW.skill IS NOT NULL THEN
        INSERT INTO public.worker_rotation (worker_id, skill)
        VALUES (NEW.id, NEW.skill)
        ON CONFLICT (worker_id, skill) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_worker_onboard ON public.profiles;
CREATE TRIGGER on_profile_worker_onboard
    AFTER INSERT OR UPDATE OF skill, role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_worker_rotation_onboard();
