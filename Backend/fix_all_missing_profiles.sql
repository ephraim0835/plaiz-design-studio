-- Backfill profiles for users who exist in auth.users but missing in public.profiles
-- UPDATED: Removed 'is_online' column as it doesn't exist in the current schema.

INSERT INTO public.profiles (id, full_name, role, specialization)
SELECT 
    au.id, 
    COALESCE(au.raw_user_meta_data->>'full_name', 'Client User'),
    COALESCE((au.raw_user_meta_data->>'role')::user_role_enum, 'client'::user_role_enum),
    au.raw_user_meta_data->>'specialization'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
