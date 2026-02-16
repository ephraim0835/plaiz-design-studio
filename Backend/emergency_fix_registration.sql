-- EMERGENCY FIX FOR REGISTRATION
-- The previous error is likely due to missing columns in the 'profiles' table 
-- that the trigger attempts to write to (specifically 'is_verified').

-- 1. ADD MISSING COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT; -- Adding email for convenience

-- 2. RE-DEFINE TRIGGER FUNCTION SAFELY
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
    meta_full_name TEXT;
    meta_avatar TEXT;
BEGIN
    -- Extract metadata safely
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_spec := NEW.raw_user_meta_data->>'specialization';
    meta_full_name := NEW.raw_user_meta_data->>'full_name';
    meta_avatar := NEW.raw_user_meta_data->>'avatar_url';

    RAISE LOG 'handle_new_user safe v2. ID: %, Role: %', NEW.id, meta_role;

    -- Logic to determine proper enum role
    IF meta_role = 'worker' THEN
        IF meta_spec = 'web_design' THEN
            target_role := 'web_designer';
        ELSE
            target_role := 'graphic_designer'; 
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    -- Insert into profiles safely
    INSERT INTO public.profiles (
        id, 
        email, -- Now safely added
        full_name, 
        avatar_url, 
        role, 
        specialization,
        is_available,
        is_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(meta_full_name, 'New User'), 
        meta_avatar, 
        target_role,
        meta_spec,
        false, -- Default availability
        false  -- Default verification
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        specialization = EXCLUDED.specialization;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE TRIGGER IS ATTACHED
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
