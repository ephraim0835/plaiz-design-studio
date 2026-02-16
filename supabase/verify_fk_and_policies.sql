-- DIAGNOSTIC: Check Foreign Keys & Policies
-- Run this to see if the database is actually linked correctly

-- 1. Check if the Foreign Key exists (Crucial!)
SELECT 
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='portfolio';

-- 2. Check if RLS is actually on
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'portfolio';

-- 3. Check effective policies again
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'portfolio';
