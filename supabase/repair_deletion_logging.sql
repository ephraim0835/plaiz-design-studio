-- Repair script for deleted_users_log
-- This script adds missing columns and fixes the deletion RPC

-- 1. Ensure columns exist in deleted_users_log
DO $$ 
BEGIN 
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='user_id') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN user_id UUID;
    END IF;

    -- Add deleted_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='deleted_by') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add email if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='email') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN email TEXT;
    END IF;

    -- Add full_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='full_name') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN full_name TEXT;
    END IF;

    -- Add role if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='role') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN role TEXT;
    END IF;

    -- Add reason if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='reason') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN reason TEXT;
    END IF;

    -- Add deleted_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deleted_users_log' AND column_name='deleted_at') THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Re-apply the updated delete_user function
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID, deletion_reason TEXT DEFAULT NULL)
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
    INSERT INTO deleted_users_log (user_id, email, full_name, role, deleted_by, reason)
    VALUES (target_user_id, target_email, target_full_name, target_role, auth.uid(), deletion_reason);

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
    
    -- Delete from auth.users (this will cascade to other auth-related tables)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    result := json_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'deleted_user_id', target_user_id,
        'email', target_email,
        'full_name', target_full_name
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

-- 3. Ensure permissions are correct
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
