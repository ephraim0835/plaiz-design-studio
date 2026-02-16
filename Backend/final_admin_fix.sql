-- ======================================================
-- FINAL ADMIN FIX: VISIBILITY & DELETION
-- Run this in your Supabase SQL Editor
-- ======================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- 1. FIX RECURSIVE RLS (This is why the list might be empty)
-- We drop the old policies and create new ones that don't cause infinite loops
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow everyone to see profiles (simplest for a studio site)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins to do everything (using a non-recursive check if needed, but SELECT true covers visibility)
-- We'll rely on the RPC function for deletion to bypass RLS restrictions on auth.users

-- 2. ROBUST DELETE FUNCTION
-- This correctly handles the 'auth' schema and 'public' profile
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    caller_role user_role_enum;
BEGIN
    -- Check caller role without triggering recursion
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users. Your role is %', caller_role;
    END IF;

    -- 1. Delete from profiles
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- 2. Delete from authentication (Supabase allows this in SECURITY DEFINER)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- 3. FORCED PROFILE CREATION (Guaranteed Fix)
-- This creates a profile directly using the ID from your screenshot
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '2c322093-a9ca-4149-93e5-da1d29374795', 
    'stickanimation007@gmail.com', 
    'Admin User', 
    'admin'::user_role_enum
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin'::user_role_enum, email = 'stickanimation007@gmail.com';

-- 4. BACKFILL ALL OTHER USERS
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    CASE 
        WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role_enum
        ELSE 'client'::user_role_enum
    END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
