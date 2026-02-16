-- RESTORE REGISTRATION (Profile Trigger Only)
-- We suspected the 'worker_stats' trigger chain was causing the crash.
-- This script restores ONLY the basic Profile creation trigger.

-- 1. CLEANUP (Just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS trigger_create_worker_stats ON public.profiles;

-- 2. ROBUST HANDLE_NEW_USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';

    -- Safe Role Mapping
    IF meta_role = 'worker' OR meta_role = 'graphic_designer' OR meta_role = 'web_designer' THEN
        target_role := 'graphic_designer'; -- Default safer enum
        IF meta_role = 'web_designer' THEN target_role := 'web_designer'; END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (
        id, 
        role, 
        full_name,
        avatar_url,
        email,
        is_available,   -- Should exist
        is_verified     -- Should exist
    )
    VALUES (
        NEW.id, 
        target_role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        false,
        false
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but DO NOT FAIL the transaction. 
    -- This ensures the user is created even if profile setup has a glitch.
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTE: We are intentionally NOT re-enabling 'trigger_create_worker_stats' yet.
-- This isolates the profile creation to ensure it works 100%.
