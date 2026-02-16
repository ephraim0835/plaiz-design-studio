-- USAGE:
-- 1. Replace 'REPLACE_WITH_EMAIL' with the EXACT email address of the user you want to update.
-- 2. The role is currently set to 'admin'. 
--    If you want to make a worker, change 'admin' to 'graphic_designer' or 'web_designer'.

DO $$
DECLARE
    -- INPUTS: Only change the email below if you want to make an Admin
    v_email TEXT := 'REPLACE_WITH_EMAIL'; 
    v_new_role_text TEXT := 'admin'; -- Defaulting to 'admin' to prevent errors. Change this if needed.
    
    -- Variables
    v_user_id UUID;
    v_new_role user_role_enum;
BEGIN
    -- Cast role text to enum
    BEGIN
        v_new_role := v_new_role_text::user_role_enum;
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid role specified: %. Must be one of: client, admin, graphic_designer, web_designer', v_new_role_text;
    END;

    -- Find user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Updating user % to role %', v_email, v_new_role;

        -- 1. Update Public Profile
        UPDATE public.profiles 
        SET role = v_new_role,
            specialization = CASE 
                WHEN v_new_role IN ('graphic_designer', 'web_designer') THEN v_new_role::text 
                ELSE 'System Administrator' 
            END
        WHERE id = v_user_id;

        -- 2. Update Auth Metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{role}',
                to_jsonb(v_new_role_text)
            )
        WHERE id = v_user_id;

        -- 3. Ensure Worker Stats exist (if role is a worker)
        IF v_new_role IN ('graphic_designer', 'web_designer') THEN
             INSERT INTO public.worker_stats (worker_id)
             VALUES (v_user_id)
             ON CONFLICT (worker_id) DO NOTHING;
        END IF;
    ELSE
        RAISE NOTICE 'User with email % not found. Please check the email spelling carefully.', v_email;
    END IF;
END $$;
