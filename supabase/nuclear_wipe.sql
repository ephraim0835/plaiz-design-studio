-- ====================================================================
-- ANTIGRAVITY ORCHESTRATION - NUCLEAR SYSTEM RESET
-- WARNING: THIS SCRIPT DELETES ALL PROJECT DATA PERMANENTLY.
-- ====================================================================

-- 1. Disable triggers temporarily to avoid side-effects
SET session_replication_role = 'replica';

-- 2. Clear all project-dependent data
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.agreements CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.project_files CASCADE;
TRUNCATE TABLE public.project_reassignments CASCADE;
TRUNCATE TABLE public.payout_logs CASCADE;
TRUNCATE TABLE public.assignment_logs CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.reviews CASCADE;

-- 3. Clear the main projects table
TRUNCATE TABLE public.projects CASCADE;

-- 4. Reset Worker Stats & Rotation (Optional but recommended for a true fresh start)
TRUNCATE TABLE public.worker_rotation CASCADE;

-- Update worker stats to reset project counters
UPDATE public.worker_stats 
SET active_projects = 0, 
    completed_projects = 0,
    average_rating = 5.0;

-- 5. Re-enable triggers
SET session_replication_role = 'origin';

-- 6. Verification Message
SELECT 'SYSTEM RESET COMPLETE: All projects, messages, and agreements have been wiped. You are now on a clean slate.' as status;
