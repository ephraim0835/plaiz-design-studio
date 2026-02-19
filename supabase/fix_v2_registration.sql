-- FIX V2 REGISTRATION & ROLES
-- Updates the system to handle 'print_specialist' and other V2 roles correctly

-- 1. Update the User Role Enum
DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'print_specialist';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Refined Registration Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
BEGIN
    -- Extract metadata
    meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    meta_spec := COALESCE(NEW.raw_user_meta_data->>'specialization', 'NONE');
    
    -- [MAPPING LOGIC]
    -- If meta_role is already a valid snake_case role, use it.
    -- Otherwise, map it.
    
    IF meta_role = 'admin' THEN
        target_role := 'admin'::user_role_enum;
    ELSIF meta_role = 'graphic_designer' OR meta_spec = 'graphic_designer' THEN
        target_role := 'graphic_designer'::user_role_enum;
    ELSIF meta_role = 'web_designer' OR meta_spec = 'web_designer' THEN
        target_role := 'web_designer'::user_role_enum;
    ELSIF meta_role = 'print_specialist' OR meta_spec = 'print_specialist' THEN
        target_role := 'print_specialist'::user_role_enum;
    ELSIF meta_role = 'worker' THEN
        -- Legacy/Social login worker mapping
        IF meta_spec = 'web_designer' OR meta_spec = 'web_design' THEN
            target_role := 'web_designer'::user_role_enum;
        ELSIF meta_spec = 'print_specialist' THEN
            target_role := 'print_specialist'::user_role_enum;
        ELSE
            target_role := 'graphic_designer'::user_role_enum;
        END IF;
    ELSE
        -- Fallback to client
        target_role := 'client'::user_role_enum;
    END IF;
    
    -- Insert Profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        specialization,
        is_active,
        verification_status,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        target_role,
        CASE WHEN meta_spec = 'NONE' THEN NULL ELSE meta_spec END,
        true,
        'PENDING', -- All new workers start as PENDING
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to avoid breaking Auth signup
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, 'User (Setup Error)', 'client')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
