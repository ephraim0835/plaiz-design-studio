-- ==========================================
-- NOTIFICATIONS RLS & TRIGGER REPAIR
-- Resolves "new row violates row-level security policy for table 'notifications'"
-- ==========================================

-- 1. Ensure RLS is enabled correctly
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Define Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.notifications;
CREATE POLICY "Allow authenticated inserts" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allows triggers and users to create notifications

-- 3. Fix Trigger Function to use SECURITY DEFINER
-- This ensures the trigger can bypass RLS on the notifications table
-- even when fired by a restricted worker account.
CREATE OR REPLACE FUNCTION notify_admin_of_portfolio_upload()
RETURNS TRIGGER 
SECURITY DEFINER -- IMPORTANT: Bypasses RLS of the user firing the trigger
AS $$
DECLARE
    admin_id UUID;
    worker_name TEXT;
BEGIN
    -- Only notify if uploaded by a non-admin
    IF (SELECT role FROM profiles WHERE id = NEW.worker_id) != 'admin' THEN
        -- Get worker name
        SELECT full_name INTO worker_name FROM profiles WHERE id = NEW.worker_id;
        
        -- Get at least one admin ID
        SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
        
        IF admin_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link, is_read, type)
            VALUES (
                admin_id,
                'New portfolio upload by ' || COALESCE(worker_name, 'a worker'),
                'New work in ' || NEW.service_type || ': ' || NEW.title,
                '/admin/gallery',
                FALSE,
                'portfolio_upload'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-grant permissions just in case
GRANT ALL ON public.notifications TO authenticated, service_role;
