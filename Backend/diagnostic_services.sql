-- DIAGNOSTIC SCRIPT V3: Ultra-Resilient Schema Check
-- Run this in your Supabase SQL Editor.

-- 1. Check for expected columns in profiles
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_verified', 'is_available', 'specialization', 'role');

-- 2. Check Service Table status
SELECT 
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') 
    THEN (SELECT count(*) || ' services found' FROM public.services)
    ELSE 'TABLE MISSING: services'
    END as status;

-- 3. Check Worker Availability (Using Dynamic SQL to prevent syntax errors)
DO $$ 
DECLARE
    worker_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') AND
       EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'worker_stats' AND column_name = 'max_projects_limit') THEN
        
        EXECUTE 'SELECT count(*) FROM public.profiles p JOIN public.worker_stats ws ON ws.worker_id = p.id WHERE p.is_verified = true AND p.is_available = true AND ws.is_probation = false AND ws.active_projects < ws.max_projects_limit' 
        INTO worker_count;
        
        RAISE NOTICE 'Workers: %', worker_count;
    ELSE
        RAISE NOTICE 'CRITICAL: Required columns are missing. Run foundation_repair.sql first.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'CRITICAL ERROR: Could not run worker check. Table or column likely missing.';
END $$;
