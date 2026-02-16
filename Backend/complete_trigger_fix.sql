-- ============================================================================
-- COMPLETE WORKER REGISTRATION FIX
-- ============================================================================
-- This script completely replaces the trigger function and ensures it works
-- ============================================================================

-- STEP 1: Drop and recreate the function with proper error handling
-- ============================================================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    -- Log for debugging (will appear in Supabase logs)
    RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
    
    -- Extract metadata
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_spec := NEW.raw_user_meta_data->>'specialization';
    
    RAISE LOG 'meta_role: %, meta_spec: %', meta_role, meta_spec;
    
    -- Determine the correct role enum
    IF meta_role = 'graphic_designer' THEN
        target_role := 'graphic_designer'::user_role_enum;
    ELSIF meta_role = 'web_designer' THEN
        target_role := 'web_designer'::user_role_enum;
    ELSIF meta_role = 'worker' THEN
        -- Legacy support: role='worker' with separate specialization
        IF meta_spec = 'web_design' OR meta_spec = 'web_designer' THEN
            target_role := 'web_designer'::user_role_enum;
        ELSE
            target_role := 'graphic_designer'::user_role_enum;
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin'::user_role_enum;
    ELSE
        -- Default to client for any other value
        target_role := 'client'::user_role_enum;
    END IF;
    
    RAISE LOG 'Determined target_role: %', target_role;
    
    -- Insert the profile
    INSERT INTO public.profiles (id, email, full_name, role, specialization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        target_role,
        COALESCE(meta_spec, meta_role)
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'ERROR in handle_new_user: % %', SQLERRM, SQLSTATE;
    -- Re-raise the error so Supabase Auth knows it failed
    RAISE;
END;
$$;

-- STEP 2: Recreate the trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- STEP 4: Verify the function was created
-- ============================================================================
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    provolatile as volatility
FROM pg_proc
WHERE proname = 'handle_new_user';

-- STEP 5: Verify the trigger exists
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- All done! The trigger function has been updated successfully.
-- Try registering a worker now.
