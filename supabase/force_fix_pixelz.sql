-- FORCE FIX PIXELZ
-- Run this to guarantee Pixelz Design is set up correctly.

-- 1. Force the role to be the exact code string required
UPDATE public.profiles
SET role = 'graphic_designer', 
    is_available = true,
    is_verified = true
WHERE full_name ILIKE '%Pixelz%';

-- 2. Ensure stats exist and are 'Elite'
INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, active_projects, pricing_tier)
SELECT id, 5.0, 10, 0, 'elite'
FROM public.profiles
WHERE full_name ILIKE '%Pixelz%'
ON CONFLICT (worker_id) 
DO UPDATE SET 
    active_projects = 0, -- Set to 0 to ensure they are "Available"
    average_rating = 5.0,
    pricing_tier = 'elite';

-- 3. Confirmation
SELECT id, full_name, role FROM public.profiles WHERE full_name ILIKE '%Pixelz%';
