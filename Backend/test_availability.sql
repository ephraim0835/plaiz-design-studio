-- TEST HELPER: Make yourself (or a worker) available for testing
-- Run this in your Supabase SQL Editor.

-- Replace the email below with YOUR email (or the worker you want to use)
-- This ensures the worker has:
-- 1. Correct specialization (web_designer / graphic_designer)
-- 2. is_verified = true
-- 3. is_available = true
-- 4. active_projects < max_projects_limit (0 < 3)

UPDATE public.profiles 
SET 
  is_verified = true, 
  is_available = true,
  specialization = 'web_designer' -- Options: 'web_designer', 'graphic_designer'
WHERE email = 'your-email@example.com'; -- <--- CHANGE THIS

-- Ensure the stats correspond
INSERT INTO public.worker_stats (worker_id, active_projects, max_projects_limit, is_probation)
SELECT id, 0, 3, false 
FROM public.profiles 
WHERE email = 'your-email@example.com' -- <--- CHANGE THIS
ON CONFLICT (worker_id) DO UPDATE SET
  active_projects = 0,
  max_projects_limit = 3,
  is_probation = false;

-- Verification: After running, run this to see if the service is now "Online"
SELECT * FROM public.check_service_availability();
