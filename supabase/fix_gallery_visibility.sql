-- FIX: Gallery Visibility & Permissions
-- This script resets RLS policies for 'portfolio' to ensure visibility

-- 1. Ensure RLS is enabled
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies
DROP POLICY IF EXISTS "Public can view approved items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can view own unapproved items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can upload own items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can update own items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can delete own items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can do everything" ON public.portfolio;
DROP POLICY IF EXISTS "Public and Users View Access" ON public.portfolio;
DROP POLICY IF EXISTS "Workers Upload Access" ON public.portfolio;
DROP POLICY IF EXISTS "Owners and Admins Update Access" ON public.portfolio;
DROP POLICY IF EXISTS "Owners and Admins Delete Access" ON public.portfolio;

-- 3. Create Clear Policies

-- A. VIEW: 
-- Anyone can see approved items
-- Users can see their own items (even pending)
-- Admins can see everything
CREATE POLICY "Universal View Access" ON public.portfolio
FOR SELECT
USING (
  is_approved = true 
  OR auth.uid() = worker_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- B. INSERT: 
-- Authenticated users can upload (must match their ID)
CREATE POLICY "Authenticated Upload Access" ON public.portfolio
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid() = worker_id
);

-- C. UPDATE: 
-- Owners can update their own
-- Admins can update any
CREATE POLICY "Owner and Admin Update Access" ON public.portfolio
FOR UPDATE
USING (
  auth.uid() = worker_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- D. DELETE: 
-- Owners can delete their own
-- Admins can delete any
CREATE POLICY "Owner and Admin Delete Access" ON public.portfolio
FOR DELETE
USING (
  auth.uid() = worker_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. CRITICAL: Ensure Profiles are Readable
-- If users can't read the 'worker_id' profile, the join fails or returns null
-- We'll enable public read for profiles (safe for basic info like name/avatar)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
