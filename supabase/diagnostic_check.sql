-- COMPREHENSIVE DIAGNOSTIC: WHAT IS HAPPENING?
-- This script tells us the state of the last 5 projects and why they matched (or didn't).

SELECT 
    p.id, 
    p.title, 
    p.status, 
    p.worker_id, 
    pr.full_name as assigned_worker,
    p.created_at
FROM public.projects p
LEFT JOIN public.profiles pr ON p.worker_id = pr.id
ORDER BY p.created_at DESC 
LIMIT 5;

-- Check any matching errors in logs
SELECT * FROM public.assignment_logs ORDER BY created_at DESC LIMIT 5;

-- Check nuclear debug logs
SELECT * FROM public.debug_matching_logs ORDER BY created_at DESC LIMIT 10;
