-- DEEP DEBUG: Services Visibility
-- Paste this into Supabase SQL Editor

-- 1. Check if table has rows (ignores RLS for you in SQL editor)
SELECT 'Table Row Count' as metric, count(*) as value FROM public.services;

-- 2. Check if is_active is true for those rows
SELECT id, title, is_active FROM public.services;

-- 3. Check RLS status
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';

-- 4. Check policies
SELECT * FROM pg_policies WHERE tablename = 'services';

-- 5. Test RPC as a query
SELECT * FROM public.check_service_availability();
