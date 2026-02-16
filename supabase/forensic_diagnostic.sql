-- FORENSIC DIAGNOSTIC: WHY IS IT QUEUING?
-- This script tells us exactly what the matching logic sees.

DO $$ 
DECLARE 
    v_worker_id UUID;
    v_pixelz_id UUID;
    v_skill_check BOOLEAN;
    v_role_check BOOLEAN;
    v_active_check BOOLEAN;
    v_norm_skill TEXT := 'graphics';
    v_role_alias TEXT := 'graphic_designer';
BEGIN
    -- 1. Find Pixelz
    SELECT id INTO v_pixelz_id FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    
    IF v_pixelz_id IS NULL THEN
        RAISE NOTICE 'FAILURE: Pixelz not found in profiles table at all!';
    ELSE
        SELECT 
            (skill = v_norm_skill OR role = v_role_alias OR v_norm_skill = ANY(COALESCE(skills, '{}'))),
            is_active
        INTO v_skill_check, v_active_check
        FROM public.profiles WHERE id = v_pixelz_id;
        
        RAISE NOTICE 'Pixelz ID: %', v_pixelz_id;
        RAISE NOTICE 'Skill Match for "graphics": %', v_skill_check;
        RAISE NOTICE 'Active Check: %', v_active_check;
        
        -- Check Role
        SELECT role INTO v_role_alias FROM public.profiles WHERE id = v_pixelz_id;
        RAISE NOTICE 'Actual Role: %', v_role_alias;
    END IF;

    -- 2. Try the actual query
    SELECT id INTO v_worker_id
    FROM public.profiles
    WHERE 
        (skill = 'graphics' OR role = 'graphic_designer' OR 'graphics' = ANY(COALESCE(skills, '{}')))
        AND role NOT IN ('client', 'admin')
        AND is_active = true
    LIMIT 1;

    IF v_worker_id IS NULL THEN
        RAISE NOTICE 'TOTAL FAILURE: No workers found with this query!';
    ELSE
        RAISE NOTICE 'SUCCESS: Found worker ID %', v_worker_id;
    END IF;
END $$;
