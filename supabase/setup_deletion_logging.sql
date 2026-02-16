-- Create deleted_users_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deleted_users_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT,
    full_name TEXT,
    role TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.deleted_users_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the deletion logs
CREATE POLICY "Admins can view deletion logs"
    ON public.deleted_users_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Update delete_user function to include logging
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    target_email TEXT;
    target_full_name TEXT;
    target_role TEXT;
BEGIN
    -- Check if the requesting user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- Prevent self-deletion
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    -- Capture metadata before deletion
    SELECT email, full_name, role 
    INTO target_email, target_full_name, target_role
    FROM profiles
    WHERE id = target_user_id;

    -- Log the deletion
    INSERT INTO deleted_users_log (user_id, email, full_name, role, deleted_by)
    VALUES (target_user_id, target_email, target_full_name, target_role, auth.uid());

    -- Delete related data in order
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    DELETE FROM messages 
    WHERE project_id IN (
        SELECT id FROM projects 
        WHERE client_id = target_user_id OR worker_id = target_user_id
    );
    
    DELETE FROM messages WHERE sender_id = target_user_id;
    DELETE FROM worker_stats WHERE worker_id = target_user_id;
    DELETE FROM projects WHERE client_id = target_user_id OR worker_id = target_user_id;
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
    
    result := json_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'deleted_user_id', target_user_id
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;
