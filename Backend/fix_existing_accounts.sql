-- ==========================================
-- FIX EXISTING USERS MISSING PROFILES
-- Run this in your Supabase SQL Editor
-- ==========================================

-- This script finds any users who exist in Authentication but are missing a Profile.
-- It automatically creates a Client profile for them so they can access the dashboard.

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Client User'),
    'client'::user_role_enum
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- If you want to see who was fixed, run this after:
-- SELECT * FROM public.profiles ORDER BY created_at DESC;
