-- FIX MISSING PROFILE
-- Since we disabled the triggers, your new account was created without a Profile.
-- This script manually creates a profile for the most recent user to ensure the dashboard works.

DO $$
DECLARE
    new_user_id UUID;
    new_user_email TEXT;
    new_user_meta JSONB;
BEGIN
    -- 1. Get the most recent user created in the last 10 minutes
    SELECT id, email, raw_user_meta_data 
    INTO new_user_id, new_user_email, new_user_meta
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF new_user_id IS NOT NULL THEN
        -- 2. Insert Profile manually
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role, 
            specialization,
            is_available,
            is_verified
        )
        VALUES (
            new_user_id,
            new_user_email,
            COALESCE(new_user_meta->>'full_name', 'New Worker'),
            'graphic_designer', -- Force to graphic_designer for this test
            COALESCE(new_user_meta->>'specialization', 'Graphic Design'),
            false,
            false -- Not verifying automatically
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Fixed profile for user: %', new_user_email;
    ELSE
        RAISE NOTICE 'No recent user found to fix.';
    END IF;
END $$;
