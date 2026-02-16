-- ============================================================================
-- COMPREHENSIVE ADMIN DASHBOARD FIX
-- ============================================================================
-- This script fixes the issue where the Admin Dashboard won't load because
-- users exist in auth.users but don't have corresponding profiles.
--
-- Run this entire script in your Supabase SQL Editor.
-- ============================================================================

-- STEP 1: Ensure the profile creation function exists
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, specialization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'client'::user_role_enum),
        NEW.raw_user_meta_data->>'specialization'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Recreate the trigger to ensure it fires for new users
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Backfill profiles for ALL existing users who don't have one
-- ============================================================================
INSERT INTO public.profiles (id, email, full_name, role, specialization)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((au.raw_user_meta_data->>'role')::user_role_enum, 'client'::user_role_enum),
    au.raw_user_meta_data->>'specialization'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- STEP 4: Fix RLS policies to ensure profiles are readable
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- STEP 4.5: Add missing columns if they don't exist
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update email for existing profiles if missing
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- STEP 5: Promote the FIRST user to admin (so you can access the dashboard)
-- ============================================================================
-- This finds a user and makes them admin
-- If you know your email, replace the WHERE clause with: WHERE email = 'your-email@example.com'
UPDATE public.profiles
SET 
    role = 'admin',
    is_active = true,
    is_verified = true
WHERE id = (
    SELECT id FROM public.profiles
    LIMIT 1
);

-- STEP 6: Ensure worker_stats table has proper RLS
-- ============================================================================
ALTER TABLE public.worker_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view worker stats" ON public.worker_stats;
CREATE POLICY "Everyone can view worker stats" 
ON public.worker_stats FOR SELECT 
USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fix worked:

-- 1. Check all users have profiles
SELECT 
    au.id,
    au.email,
    p.full_name,
    p.role,
    CASE WHEN p.id IS NULL THEN 'MISSING PROFILE!' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- 2. Check who is admin
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE role = 'admin';
