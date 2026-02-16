-- CLEANUP SCRIPT: WIPE TEST DATA
-- This script removes all projects and associated data to give you a clean slate.
-- WARNING: This will delete ALL message history and project records.

BEGIN;

-- 1. FIX SCHEMA (Ensures future notifications work)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS project_id UUID;

-- 2. Delete dependent notifications
-- We delete all notifications since they are test-related
DELETE FROM public.notifications;

-- 3. Delete messages and conversations
-- We use a block to handle cases where tables might not exist or columns are different
DO $$ 
BEGIN 
    DELETE FROM public.messages;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping messages cleanup: %', SQLERRM;
END $$;

DO $$ 
BEGIN 
    DELETE FROM public.conversations;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping conversations cleanup: %', SQLERRM;
END $$;

-- 4. Delete agreements/proposals
DELETE FROM public.agreements;

-- 5. Delete logs
DELETE FROM public.assignment_logs;
DELETE FROM public.debug_matching_logs;

-- 6. Delete projects
-- High-stakes delete: clear everything for fresh start
DELETE FROM public.projects;

-- 7. RESET ROTATION (Gives every designer a fresh start)
UPDATE public.worker_rotation 
SET last_assigned_at = NULL, 
    assignment_count = 0;

COMMIT;

-- Verification Query
SELECT 'Projects Remaining' as info, count(*) FROM public.projects
UNION ALL
SELECT 'Messages Remaining', count(*) FROM public.messages;
