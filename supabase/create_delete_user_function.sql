-- Fixed delete_user RPC function
-- This function safely deletes a user and all related data
-- Updated to match actual database schema

-- Drop existing function if it exists (with any signature)
DROP FUNCTION IF EXISTS public.delete_user(UUID);

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
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

    -- Delete related data in order (respecting foreign key constraints)
    -- Only delete from tables that actually exist
    
    -- Delete notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    -- Delete messages from projects where user is client or worker
    -- This must happen before deleting projects due to foreign key constraint
    DELETE FROM messages 
    WHERE project_id IN (
        SELECT id FROM projects 
        WHERE client_id = target_user_id OR worker_id = target_user_id
    );
    
    -- Delete messages sent by the user
    DELETE FROM messages WHERE sender_id = target_user_id;
    
    -- Delete worker stats
    DELETE FROM worker_stats WHERE worker_id = target_user_id;
    
    -- Delete projects (as client or worker)
    DELETE FROM projects WHERE client_id = target_user_id OR worker_id = target_user_id;
    
    -- Delete profile
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Delete from auth.users (this will cascade to other auth-related tables)
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

-- Grant execute permission to authenticated users (function checks for admin role internally)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
