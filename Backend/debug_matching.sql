-- DEBUG MATCHING LOGIC
-- This script simulates the exact logic used by auto_assign_worker
-- to tell you WHY nobody is matching.

DO $$
DECLARE
    -- The service you are trying to request
    test_service TEXT := 'graphic_design'; 
    
    -- Variables for debugging
    target_role TEXT;
    candidates_count INT;
    available_candidate_id UUID;
BEGIN
    -- 1. Determine Target Role (Copying exact logic from auto_assign_worker)
    CASE 
        WHEN test_service IN ('graphic_design', 'web_design', 'ui_ux') THEN target_role := 'designer';
        WHEN test_service = 'print_specialist' THEN target_role := 'print_specialist';
        WHEN test_service = 'video_editor' THEN target_role := 'video_editor';
        WHEN test_service = 'developer' THEN target_role := 'developer';
        ELSE target_role := 'worker';
    END CASE;

    RAISE NOTICE 'Testing matching for service: "%", expecting role: "%"', test_service, target_role;

    -- 2. Count TOTAL candidates with that role (Ignore availability)
    SELECT COUNT(*) INTO candidates_count FROM public.profiles WHERE role = target_role;
    RAISE NOTICE 'Total profiles found with role "%": %', target_role, candidates_count;

    -- 3. Check detailed status of these candidates
    RAISE NOTICE '--- Candidate Details ---';
    FOR available_candidate_id IN SELECT id FROM public.profiles WHERE role = target_role
    LOOP
        DECLARE
            p_email TEXT;
            p_avail BOOL;
            p_verif BOOL;
            w_active INT;
            w_max INT;
            w_prob BOOL;
        BEGIN
            SELECT email, is_available, is_verified INTO p_email, p_avail, p_verif 
            FROM public.profiles WHERE id = available_candidate_id;
            
            SELECT active_projects, max_projects_limit, is_probation INTO w_active, w_max, w_prob
            FROM public.worker_stats WHERE worker_id = available_candidate_id;

            RAISE NOTICE 'Candidate: %', p_email;
            RAISE NOTICE '  > Role Match? YES';
            RAISE NOTICE '  > Available? % (Needs TRUE)', p_avail;
            RAISE NOTICE '  > Verified? % (Needs TRUE)', p_verif;
            RAISE NOTICE '  > Probation? % (Needs FALSE)', COALESCE(w_prob, false);
            RAISE NOTICE '  > Capacity? % / % (Needs Active < Max)', COALESCE(w_active, 0), COALESCE(w_max, 3);
            
            IF p_avail = true AND p_verif = true AND COALESCE(w_prob, false) = false AND COALESCE(w_active, 0) < COALESCE(w_max, 3) THEN
                RAISE NOTICE '  ✅ MATCHABLE';
            ELSE
                RAISE NOTICE '  ❌ NOT MATCHABLE';
            END IF;
        END;
    END LOOP;

END $$;
