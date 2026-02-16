-- FIX ROLE CHECK CONSTRAINT
-- The error "violates check constraint profiles_role_check" means the allowed values for 'role' are too strict.
-- We need to expand it to allow 'graphic_designer' and 'web_designer'.

-- 1. Drop the restrictive constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add a comprehensive constraint
-- Allowing both specific roles (graphic_designer) and generic ones (worker) to be safe.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role::text IN ('client', 'admin', 'worker', 'graphic_designer', 'web_designer'));

-- 3. RETRY FIXING MISSING PROFILE (Integrated here for convenience)
DO $$
DECLARE
    new_user_id UUID;
    new_user_email TEXT;
    new_user_meta JSONB;
BEGIN
    -- Get the most recent user
    SELECT id, email, raw_user_meta_data 
    INTO new_user_id, new_user_email, new_user_meta
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF new_user_id IS NOT NULL THEN
        -- Insert Profile manually
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
            'graphic_designer', -- Now this should pass
            COALESCE(new_user_meta->>'specialization', 'Graphic Design'),
            false,
            false 
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Fixed profile for user: %', new_user_email;
    END IF;
END $$;
