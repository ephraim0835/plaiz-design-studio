-- ADMIN CHAT ACCESS FIX
-- Re-enables Admin ability to view and send messages in all project threads.

-- 1. DROP EXISTING CONFLICTING POLICIES
DROP POLICY IF EXISTS "Users can insert messages to their projects" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for their projects" ON public.messages;

-- 2. RECREATE SELECT POLICY (Including Admin)
-- This ensures admins can see messages even if they aren't the client or worker.
CREATE POLICY "Allow project participants and admins to view messages v2"
ON public.messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = messages.project_id
        AND (p.client_id = auth.uid() OR p.worker_id = auth.uid())
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. RECREATE INSERT POLICY (Including Admin)
-- This fix addresses the "RLS Violation" error when Admins try to send messages.
CREATE POLICY "Allow project participants and admins to insert messages v2"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
            AND (p.client_id = auth.uid() OR p.worker_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- 4. VERIFY PERMISSIONS (Hint: Run this to see active policies)
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'messages';
