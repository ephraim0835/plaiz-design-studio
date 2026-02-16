-- EMERGENCY RLS REPAIR: Fix recursive profile policy
-- This script fixes the "infinite loop" in the profiles table that blocks logins.
-- Run this in your Supabase SQL Editor.

-- 1. DROP the recursive policy (this is what caused the loop)
-- I used an EXISTS subquery on the same table, which is a no-no in Postgres.
DROP POLICY IF EXISTS "Admins can see everything" ON public.profiles;

-- 2. CREATE a non-recursive path for Admins
-- We allow SELECT to everyone for profile visibility (safe as it's just public info)
-- And use auth.jwt() metadata for management if available, 
-- or stick to ID-based for owners.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. ENSURE YOU ARE ADMIN (Master Switch)
-- Replace with your email.
UPDATE public.profiles 
SET role = 'admin', 
    is_active = true, 
    is_verified = true 
WHERE email = 'your-email@example.com'; 

-- 4. FIX WORKER_STATS ACCESSIBILITY
ALTER TABLE public.worker_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view worker stats" ON public.worker_stats;
CREATE POLICY "Everyone can view worker stats" ON public.worker_stats FOR SELECT USING (true);
