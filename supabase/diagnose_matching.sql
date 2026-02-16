-- DIAGNOSTIC SCRIPT: Why are projects queueing?
-- Run this in Supabase SQL Editor to see why the matching isn't working.

-- 1. Check for errors in the last assignments
SELECT 
    created_at, 
    match_reason, 
    details 
FROM public.assignment_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check worker availability and verification status
SELECT 
    p.full_name,
    p.role,
    p.skill,
    p.is_available,
    p.is_active,
    COALESCE(ba.is_verified, false) as is_verified,
    COALESCE(ws.active_projects, 0) as active_projects
FROM public.profiles p
LEFT JOIN public.bank_accounts ba ON ba.worker_id = p.id
LEFT JOIN public.worker_stats ws ON ws.worker_id = p.id
WHERE p.role NOT IN ('client', 'admin');

-- 3. Check for skill mismatches (What skills do we have vs what are we searching for?)
SELECT DISTINCT skill FROM public.profiles WHERE role NOT IN ('client', 'admin');
SELECT DISTINCT role FROM public.profiles WHERE role NOT IN ('client', 'admin');
