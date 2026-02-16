-- ==========================================
-- PROMOTE USER TO ADMIN
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Replace 'your-email@example.com' with the email of your admin account
UPDATE public.profiles 
SET role = 'admin'::user_role_enum
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';
