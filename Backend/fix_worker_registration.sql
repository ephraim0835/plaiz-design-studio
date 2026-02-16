-- ============================================================================
-- FIX WORKER REGISTRATION TRIGGER
-- ============================================================================
-- This script fixes the handle_new_user() function to properly handle
-- worker specializations (graphic_designer, web_designer)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_spec := NEW.raw_user_meta_data->>'specialization';
    
    -- Determine the correct role enum
    -- The frontend sends specialization values like 'graphic_designer' or 'web_designer' as the role
    IF meta_role = 'graphic_designer' OR meta_role = 'web_designer' THEN
        -- Direct specialization role
        target_role := meta_role::user_role_enum;
    ELSIF meta_role = 'worker' THEN
        -- Legacy: role='worker' with separate specialization field
        IF meta_spec = 'web_design' OR meta_spec = 'web_designer' THEN
            target_role := 'web_designer'::user_role_enum;
        ELSE
            target_role := 'graphic_designer'::user_role_enum;
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin'::user_role_enum;
    ELSE
        -- Default to client
        target_role := 'client'::user_role_enum;
    END IF;
    
    -- Insert the profile
    INSERT INTO public.profiles (id, email, full_name, role, specialization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        target_role,
        COALESCE(meta_spec, meta_role) -- Store the specialization
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
