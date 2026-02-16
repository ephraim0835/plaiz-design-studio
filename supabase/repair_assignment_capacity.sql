
-- REPAIR WORKER CAPACITY & SYNC STATS
-- This script fixes the "stuck" queued projects by resetting stale stats

-- 1. Reset worker_stats to match actual active projects
UPDATE public.worker_stats ws
SET active_projects = (
    SELECT COUNT(*) 
    FROM public.projects p 
    WHERE p.worker_id = ws.worker_id 
    AND p.status NOT IN ('completed', 'cancelled')
);

-- 2. Increase limits to prevent future blockage
UPDATE public.worker_stats 
SET max_projects_limit = 20 
WHERE worker_id IN (
    SELECT id FROM public.profiles WHERE role != 'client'
);

-- 3. Ensure all workers have stats entries
INSERT INTO public.worker_stats (worker_id, active_projects, max_projects_limit, average_rating, total_projects, availability_status)
SELECT 
    id, 
    0, 
    20, 
    5.0, 
    0, 
    'available'
FROM public.profiles 
WHERE role != 'client'
ON CONFLICT (worker_id) DO NOTHING;

-- 4. Force a re-match for the stuck project (Gabriel's test project)
-- Calling the RPC directly for the known stuck ID
SELECT match_worker_to_project(
    'c80db9d5-1b01-4d2e-8374-9cd7c6423576'::uuid, 
    'graphics', 
    0
);

-- 5. Optional: If no worker was found above, just manually assign to Gabriel (the user) for testing
UPDATE public.projects 
SET status = 'assigned', worker_id = client_id
WHERE id = 'c80db9d5-1b01-4d2e-8374-9cd7c6423576' 
AND worker_id IS NULL;
