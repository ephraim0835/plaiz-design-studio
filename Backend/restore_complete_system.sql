-- RESTORE COMPLETE SYSTEM HEALTH
-- Run this to ensure:
-- 1. Constraints are correct
-- 2. Registration triggers are active
-- 3. Worker Stats are created automatically

-- A. FIX CONSTRAINTS
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role::text IN ('client', 'admin', 'worker', 'graphic_designer', 'web_designer'));

-- B. RE-DEFINE MAIN REGISTRATION FUNCTION (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';

    -- Logic to determine proper enum role
    IF meta_role = 'worker' OR meta_role = 'graphic_designer' OR meta_role = 'web_designer' THEN
        target_role := 'graphic_designer'; -- Default simple enum
        IF meta_role = 'web_designer' THEN target_role := 'web_designer'; END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id, 
        email,
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
        NEW.raw_user_meta_data->>'avatar_url', 
        target_role,
        NEW.raw_user_meta_data->>'specialization',
        false, -- Default availability
        false  -- Default verification
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. RE-ATTACH MAIN TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- D. RE-DEFINE WORKER STATS TRIGGER (Safe Version)
CREATE OR REPLACE FUNCTION public.create_worker_stats_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IN ('graphic_designer', 'web_designer', 'worker') THEN
        INSERT INTO public.worker_stats (worker_id)
        VALUES (NEW.id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating worker stats: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. RE-ATTACH STATS TRIGGER
DROP TRIGGER IF EXISTS trigger_create_worker_stats ON public.profiles;
CREATE TRIGGER trigger_create_worker_stats
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_worker_stats_entry();
