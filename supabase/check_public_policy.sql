-- Get the full USING clause for the "Profiles are viewable by everyone" policy
SELECT 
    policyname,
    cmd,
    qual -- This is the USING clause
FROM pg_policies
WHERE tablename = 'profiles' 
  AND policyname = 'Profiles are viewable by everyone';
