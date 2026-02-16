-- NOTIFICATION SYSTEM SETUP
-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional URL to redirect to
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Trigger for Project Assignment (Notify Worker)
CREATE OR REPLACE FUNCTION public.notify_worker_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') AND NEW.worker_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            NEW.worker_id,
            'New Project Assigned',
            'You have been assigned to project: ' || NEW.title,
            '/worker' -- Link to dashboard or specific project
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_assignment_notify_worker ON public.projects;
CREATE TRIGGER on_assignment_notify_worker
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_worker_assignment();

-- 5. Trigger for Project Assignment (Notify Client)
CREATE OR REPLACE FUNCTION public.notify_client_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            NEW.client_id,
            'Worker Assigned',
            'A worker has been assigned to your project: ' || NEW.title,
            '/client'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_assignment_notify_client ON public.projects;
CREATE TRIGGER on_assignment_notify_client
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_client_assignment();
