-- Check if RLS is enabled on portfolio table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'portfolio';

-- Check existing RLS policies on portfolio table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'portfolio';
