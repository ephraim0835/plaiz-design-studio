-- ============================================================================
-- STRICT ROLE ENFORCEMENT & REGISTRATION FIX
-- ============================================================================
-- This script replaces the registration trigger with a version that is
-- extremely explicit about role assignment and includes diagnostic logging.
-- ============================================================================

-- 1. DROP EXISTING TRIGGER & FUNCTION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. CREATE REFINED TRIGGER FUNCTION
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
    -- [DIAGNOSTIC] Log for Supabase Auth Logs
    RAISE LOG 'Registration Trigger Fired for ID: %, Email: %', NEW.id, NEW.email;
    
    -- Extract metadata from Supabase Auth
    meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'NONE');
    meta_spec := COALESCE(NEW.raw_user_meta_data->>'specialization', 'NONE');
    
    RAISE LOG 'Auth Metadata Detected -> Role: %, Specialization: %', meta_role, meta_spec;
    
    -- [EXPLICIT ROLE MAPPING]
    -- We only assign privileged roles if specifically requested in metadata.
    -- Everything else MUST fallback to 'client'.
    
    IF meta_role = 'admin' THEN
        target_role := 'admin'::user_role_enum;
    ELSIF meta_role = 'graphic_designer' OR meta_spec = 'graphic_designer' THEN
        target_role := 'graphic_designer'::user_role_enum;
    ELSIF meta_role = 'web_designer' OR meta_spec = 'web_designer' THEN
        target_role := 'web_designer'::user_role_enum;
    ELSIF meta_role = 'worker' THEN
        -- Legacy worker handling
        IF meta_spec = 'web_designer' OR meta_spec = 'web_design' THEN
            target_role := 'web_designer'::user_role_enum;
        ELSE
            target_role := 'graphic_designer'::user_role_enum;
        END IF;
    ELSE
        -- SAFETY FALLBACK: Always client
        target_role := 'client'::user_role_enum;
    END IF;
    
    RAISE LOG 'Final Role Assigned in Database: %', target_role;
    
    -- 3. INSERT PROFILE RECORD
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        specialization,
        is_active,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        target_role,
        CASE WHEN meta_spec = 'NONE' THEN NULL ELSE meta_spec END,
        true,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = EXCLUDED.role,
        email = EXCLUDED.email;
    
    RAISE LOG 'Profile Record Successfully Created for %', NEW.email;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'CRITICAL ERROR in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW; -- Still return NEW to allow auth account creation even if profile fails
END;
$$;

-- 4. RECREATE TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 5. DIAGNOSTIC QUERY (Run this after registering to verify)
-- SELECT id, email, role, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 5;
