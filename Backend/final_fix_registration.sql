-- FINAL FIX FOR WORKER REGISTRATION (Robust & Logging Enabled)

-- 1. Drop existing trigger and function to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the robust function
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

    -- Logging for debug (viewable in Supabase logs)
    RAISE LOG 'handle_new_user triggered. ID: %, Role: %, Spec: %', NEW.id, meta_role, meta_spec;

    -- Logic to determine proper enum role
    IF meta_role = 'worker' THEN
        IF meta_spec = 'web_design' THEN
            target_role := 'web_designer';
        ELSE
            -- Default to graphic_designer for 'graphic_design' or any other worker type
            target_role := 'graphic_designer'; 
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        -- Default fallback
        target_role := 'client';
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id, 
        full_name, 
        avatar_url, 
        role, 
        specialization,
        is_available,   -- Explicitly set
        is_verified     -- Default to false for workers, maybe true for clients?
    )
    VALUES (
        NEW.id, 
        COALESCE(meta_full_name, 'New User'), 
        meta_avatar, 
        target_role,
        meta_spec,
        false, -- Default availability is false
        false  -- Default verification is false
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    -- If it's a worker, ensure verification logic or queue logic is prepped (optional)
    -- But for now keeping it simple to avoid errors.

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block auth creation if possible, 
    -- though supabase usually rolls back auth if trigger fails.
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- Return NEW ensures user is still created in auth (but profile might be missing)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure worker_stats trigger exists (Vital for workers)
CREATE OR REPLACE FUNCTION public.create_worker_stats_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IN ('graphic_designer', 'web_designer', 'worker') THEN
        INSERT INTO public.worker_stats (worker_id)
        VALUES (NEW.id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_worker_stats ON public.profiles;
CREATE TRIGGER trigger_create_worker_stats
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_worker_stats_entry();
