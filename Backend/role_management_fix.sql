-- ======================================================
-- ADMIN ROLE MANAGEMENT FIX
-- ======================================================
-- This creates a secure function for admins to switch user roles
-- ======================================================

CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role user_role_enum)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    caller_role user_role_enum;
BEGIN
    -- 1. Check if the caller is an admin
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

    IF caller_role IS NULL OR caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can change user roles. Your current role is %', COALESCE(caller_role::TEXT, 'unknown');
    END IF;

    -- 2. Prevent role self-demotion (Safety check)
    IF target_user_id = auth.uid() AND new_role != 'admin' THEN
        RAISE EXCEPTION 'Safety Error: You cannot remove your own admin role. Please have another admin change your role if needed.';
    END IF;

    -- 3. Update the profile
    UPDATE public.profiles 
    SET role = new_role
    WHERE id = target_user_id;

    -- 4. If target role is a worker role, ensure worker_stats exists (optional helper)
    IF new_role IN ('graphic_designer', 'web_designer') THEN
        INSERT INTO public.worker_stats (worker_id)
        VALUES (target_user_id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;
    
    RAISE LOG 'Admin % updated role of user % to %', auth.uid(), target_user_id, new_role;
END;
$$;

-- Grant execution permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, user_role_enum) TO authenticated;

-- Diagnostic verification
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'update_user_role';
