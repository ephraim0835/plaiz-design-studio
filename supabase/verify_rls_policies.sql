-- Verify RLS policies were created
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as has_qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
