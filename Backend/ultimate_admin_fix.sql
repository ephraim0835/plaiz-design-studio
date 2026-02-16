-- ======================================================
-- ULTIMATE ADMIN & USER MANAGEMENT FIX
-- Run this in your Supabase SQL Editor
-- ======================================================

-- 1. FIX SCHEMA (Add missing columns)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. CREATE DELETE FUNCTION (Admin Only)
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
    END IF;

    -- Delete from public.profiles
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- 3. REANIMATE ALL PROFILES (Backfill missing data)
-- This ensures every user in Authentication has a Profile and an Email record
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    CASE 
        WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role_enum
        WHEN au.raw_user_meta_data->>'role' = 'graphic_designer' THEN 'graphic_designer'::user_role_enum
        WHEN au.raw_user_meta_data->>'role' = 'web_designer' THEN 'web_designer'::user_role_enum
        WHEN au.raw_user_meta_data->>'role' = 'worker' THEN 'worker'::user_role_enum
        ELSE 'client'::user_role_enum
    END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE 
SET 
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- 4. MANUALLY SET YOUR ADMIN ACCOUNT
-- IMPORTANT: Replace 'your-email@example.com' with the email you use to sign in
UPDATE public.profiles 
SET role = 'admin'::user_role_enum 
WHERE email = 'your-email@example.com';

-- 5. VERIFY ADMISSION
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE role = 'admin';
