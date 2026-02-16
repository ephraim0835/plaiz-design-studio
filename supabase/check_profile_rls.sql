-- Check if your profile exists and RLS policies are correct
-- Run this in Supabase SQL Editor

-- 1. Check if your profile exists
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE email = 'YOUR_EMAIL_HERE'; -- Replace with your email

-- 2. Check current RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 4. If no profile exists, create one manually (replace values)
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT 
--     auth.uid(),
--     'YOUR_EMAIL_HERE',
--     'YOUR_NAME',
--     'admin' -- or 'client', 'worker', etc.
-- WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid());
