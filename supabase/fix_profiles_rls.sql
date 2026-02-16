-- Fix missing RLS policies on profiles table
-- This allows users to read their own profile and admins to read all profiles

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Enable RLS (in case it's not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';
