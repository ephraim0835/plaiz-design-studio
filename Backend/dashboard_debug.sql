-- DASHBOARD DEBUG: Check for data issues that could crash the UI
-- Run this in your Supabase SQL Editor.

-- 1. Check Projects for missing status or required fields
SELECT id, title, status, client_id, worker_id, project_type 
FROM public.projects 
WHERE status IS NULL OR title IS NULL;

-- 2. Check for profiles with missing roles (causes Account Setup Incomplete)
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE role IS NULL;

-- 3. Check for your current user specifically
-- (Update the email below to yours)
SELECT id, email, role, specialization 
FROM public.profiles 
WHERE email = 'your-email@example.com'; 

-- 4. Check for orphaned worker_stats (missing worker_id in profiles)
SELECT ws.worker_id 
FROM public.worker_stats ws
LEFT JOIN public.profiles p ON p.id = ws.worker_id
WHERE p.id IS NULL;
