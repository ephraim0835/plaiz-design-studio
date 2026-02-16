-- FINAL FORENSIC AUDIT (V1.2)
-- Run this AFTER master_repair_ultra.sql to see why projects matched (or didn't).

SELECT 
    p.created_at, 
    p.title, 
    p.status, 
    p.worker_id,
    al.match_reason as assignment_reason,
    dl.criteria as step,
    dl.status as step_status,
    dl.match_reason as debug_reason
FROM public.projects p
LEFT JOIN public.assignment_logs al ON al.project_id = p.id
LEFT JOIN public.debug_matching_logs dl ON dl.project_id = p.id
ORDER BY p.created_at DESC 
LIMIT 5;
