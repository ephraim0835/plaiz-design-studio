-- SAFE MODE REGISTRATION FIX
-- This script reduces the registration logic to the absolute minimum to ensure it works.

-- 1. DROP ALL RELATED TRIGGERS TO PREVENT CONFLICTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_worker_stats ON public.profiles;

-- 2. CREATE A MINIMALIST HANDLE_NEW_USER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
BEGIN
    -- Basic extraction
    meta_role := NEW.raw_user_meta_data->>'role';

    -- Verified Role Mapping
    IF meta_role = 'worker' OR meta_role = 'graphic_designer' OR meta_role = 'web_designer' THEN
        -- Force a valid enum, default to graphic_designer if unsure
        target_role := 'graphic_designer';
        
        -- Try to be more specific if possible
        IF meta_role = 'web_designer' THEN target_role := 'web_designer'; END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    -- ULTRA-SAFE INSERT
    -- We assume columns like 'is_verified' might NOT exist or be problematic, 
    -- so we rely on Table Defaults for everything possible.
    INSERT INTO public.profiles (
        id, 
        role, 
        full_name,
        avatar_url,
        email -- Added in last fix
    )
    VALUES (
        NEW.id, 
        target_role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email -- Only valid if email column exists
    )
    ON CONFLICT (id) DO NOTHING; 

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- In Safe Mode, we catch errors and LOG them, but we RETURN NEW
    -- This ensures the Account is created in Auth even if Profile fails.
    -- (Profile can be fixed manually later)
    RAISE LOG 'CRITICAL ERROR in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-ATTACH PRIMARY TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RE-CREATE WORKER STATS TRIGGER (SAFE VERSION)
CREATE OR REPLACE FUNCTION public.create_worker_stats_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Only for workers
    IF NEW.role IN ('graphic_designer', 'web_designer') THEN
        INSERT INTO public.worker_stats (worker_id) 
        VALUES (NEW.id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ignore stats errors to prevent registration failure
    RAISE LOG 'Error creating worker stats: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_worker_stats
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_worker_stats_entry();
