-- Check roles for each policy and drop the potentially recursive one

-- 1. Check which roles each policy applies to
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. Drop the recursive policy (Admins can view all profiles)
-- This policy queries the profiles table (to check role) while securing the profiles table
-- causing an infinite loop for every row check.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Ensure the "Public" policy actually covers authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO authenticated, anon -- Explicitly apply to both
USING (true);

-- 4. Verify policies after cleanup
SELECT policyname, roles, qual FROM pg_policies WHERE tablename = 'profiles';
