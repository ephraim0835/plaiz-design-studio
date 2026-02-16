-- PHASE 21 HOTFIX: Notification Schema Repair
-- This script adds the missing 'type' and 'project_id' columns to the notifications table.

DO $$ 
BEGIN
    -- 1. Add 'type' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT;
    END IF;

    -- 2. Add 'project_id' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'project_id') THEN
        ALTER TABLE public.notifications ADD COLUMN project_id UUID;
    END IF;

    -- 3. Ensure the columns are indexed for performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_type') THEN
        CREATE INDEX idx_notifications_user_type ON public.notifications(user_id, type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_project') THEN
        CREATE INDEX idx_notifications_project ON public.notifications(project_id);
    END IF;

END $$;

-- Permissions check
GRANT ALL ON public.notifications TO authenticated, service_role;
