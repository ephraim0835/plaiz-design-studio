-- Migration: Update delete_user (Idempotent + Schema Fix + Removed Invalid Table)

-- 1. Create table if missing (Base Structure)
CREATE TABLE IF NOT EXISTS public.deleted_users_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email TEXT,
    role TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by UUID REFERENCES auth.users(id)
);

-- 2. Add 'deletion_reason' column if missing (IDEMPOTENT FIX)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'deleted_users_log' 
        AND column_name = 'deletion_reason'
    ) THEN
        ALTER TABLE public.deleted_users_log ADD COLUMN deletion_reason TEXT;
    END IF;
END $$;

-- 3. Enable RLS and Policies (Idempotent)
ALTER TABLE public.deleted_users_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view deletion logs" ON public.deleted_users_log;
CREATE POLICY "Admins can view deletion logs" ON public.deleted_users_log
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Update Function (Removed reference to non-existent 'external_portfolios')
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID, deletion_reason TEXT DEFAULT 'No reason provided')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    v_user_email TEXT;
    v_user_role TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = target_user_id;
    SELECT role INTO v_user_role FROM profiles WHERE id = target_user_id;

    INSERT INTO public.deleted_users_log (user_id, email, role, deletion_reason, deleted_by)
    VALUES (target_user_id, v_user_email, v_user_role, deletion_reason, auth.uid());

    DELETE FROM notifications WHERE user_id = target_user_id;
    DELETE FROM messages WHERE project_id IN (SELECT id FROM projects WHERE client_id = target_user_id OR worker_id = target_user_id);
    DELETE FROM messages WHERE sender_id = target_user_id;
    DELETE FROM worker_stats WHERE worker_id = target_user_id;
    DELETE FROM bank_accounts WHERE worker_id = target_user_id;
    -- REMOVED: DELETE FROM external_portfolios WHERE worker_id = target_user_id; -- Table does not exist
    DELETE FROM projects WHERE client_id = target_user_id OR worker_id = target_user_id;
    DELETE FROM profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RETURN json_build_object('success', true, 'message', 'User deleted successfully', 'deleted_user_id', target_user_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID, TEXT) TO authenticated;
