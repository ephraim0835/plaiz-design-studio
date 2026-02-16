-- REMOVE PROBATION
-- Run this to upgrade Pixelz Design to full status.

UPDATE public.worker_stats
SET 
    is_probation = false,
    pricing_tier = 'elite',
    active_projects = 0 -- Ensure they are free to take the job
WHERE worker_id IN (
    SELECT id FROM public.profiles WHERE full_name ILIKE '%Pixelz%'
);
