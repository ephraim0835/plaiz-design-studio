-- DEBUG SCRIPT
-- Run this in Supabase > SQL Editor

-- 1. Find the user by name (flexible search)
SELECT id, full_name, role, email, created_at
FROM public.profiles
WHERE full_name ILIKE '%Pixelz%';

-- 2. Check their stats
SELECT * 
FROM public.worker_stats 
WHERE worker_id IN (
    SELECT id FROM public.profiles WHERE full_name ILIKE '%Pixelz%'
);

-- 3. Test the Match Function manually with specific params
SELECT public.calculate_match_score(
    (SELECT id FROM public.profiles WHERE full_name ILIKE '%Pixelz%' LIMIT 1),
    'graphic_design',
    'graphic_designer'
);
