-- FINAL DEBUG
-- Run this to see why the match fails.

-- 1. Check Profile & Stats for Pixelz
SELECT 
    p.id, 
    p.full_name, 
    p.role, 
    p.is_available,
    ws.active_projects,
    ws.is_probation,
    ws.pricing_tier
FROM public.profiles p
LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.full_name ILIKE '%Pixelz%';

-- 2. Run the internal query of find_best_worker manually
SELECT p.id, p.full_name 
FROM public.profiles p
JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.role = 'graphic_designer';

-- 3. Run the score calculation manually
SELECT public.calculate_match_score(
    (SELECT id FROM public.profiles WHERE full_name ILIKE '%Pixelz%' LIMIT 1),
    'graphic_design',
    'graphic_designer'
);

-- 4. Run the full match function manually
SELECT public.find_best_worker('graphic_design', 'graphic_designer');
