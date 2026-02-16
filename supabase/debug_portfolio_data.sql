-- DEBUG: Portfolio Data & Joins

-- 1. Count total items
SELECT count(*) as total_portfolio_items FROM public.portfolio;

-- 2. Show recent items with approval status and worker_id
SELECT id, title, is_approved, worker_id, created_at, image_url 
FROM public.portfolio 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if worker_id exists in profiles (Crucial for the join)
-- If this returns empty for a portfolio item, the JOIN will fail or return null for the profile
SELECT p.id as portfolio_id, p.worker_id, pr.full_name, pr.role
FROM public.portfolio p
LEFT JOIN public.profiles pr ON p.worker_id = pr.id
ORDER BY p.created_at DESC 
LIMIT 5;

-- 4. Storage: Check 'projects' bucket configuration
SELECT id, name, public, avif_autodetection, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'projects';
