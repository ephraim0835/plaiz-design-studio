-- ==========================================
-- EMERGENCY ADMIN MANAGEMENT FIX
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add missing columns to profiles if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Secure RPC to delete a user (Admin only)
-- This deletes from BOTH profiles and auth.users
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the person calling this is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
    END IF;

    -- Delete from public.profiles (cascades or manual)
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Delete from auth.users (requires SECURITY DEFINER)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- 3. Backfill missing profiles and emails
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((au.raw_user_meta_data->>'role')::user_role_enum, 'client'::user_role_enum)
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email WHERE profiles.email IS NULL;

-- 4. Ensure RLS allows admin to call delete_user (handled by SECURITY DEFINER)
-- Grant permission to call the function
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
