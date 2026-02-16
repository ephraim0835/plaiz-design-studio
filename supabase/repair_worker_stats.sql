-- DATA REPAIR SCRIPT
-- Run this in Supabase > SQL Editor

-- 1. Insert missing worker_stats for existing designers
INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, active_projects, is_probation, pricing_tier)
SELECT id, 5.0, 0, 0, false, 'senior'
FROM public.profiles
WHERE role IN ('graphic_designer', 'web_designer', 'worker', 'graphic_design') -- Include common variations
AND id NOT IN (SELECT worker_id FROM public.worker_stats);

-- 2. Normalize Role Names (Fix typos like 'graphic_design' -> 'graphic_designer')
UPDATE public.profiles
SET role = 'graphic_designer'
WHERE role = 'graphic_design';

-- 3. Verify the fix
-- This query shows who is now eligible for AI matching
SELECT p.full_name, p.role, ws.active_projects, ws.pricing_tier
FROM public.profiles p
JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.role IN ('graphic_designer', 'web_designer');
