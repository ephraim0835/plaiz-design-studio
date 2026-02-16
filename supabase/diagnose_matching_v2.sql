-- DIAGNOSTIC TOOL V2.1: Granular Funnel Analysis
-- Run this in Supabase SQL Editor to find the exact bottleneck.

-- 1. FUNNEL ANALYSIS: Where are we losing workers?
-- Shows the filtering process for the last 5 failed matches.
SELECT 
    created_at, 
    details->'params'->>'searched_skill' as skill_sought,
    details->'params'->>'budget' as budget_offered,
    (details->'funnel'->>'1_total_workers')::int as pool_size,
    (details->'funnel'->>'2_skill_matches')::int as skill_match,
    (details->'funnel'->>'3_available_workers')::int as available,
    (details->'funnel'->>'4_verified_bank_workers')::int as verified_bank,
    (details->'funnel'->>'5_budget_matches')::int as budget_match,
    details as full_json
FROM public.assignment_logs 
WHERE match_reason = 'MATCH_FAILED'
ORDER BY created_at DESC 
LIMIT 5;

-- 2. WORKER READINESS CHECK
-- Check if any worker is actually ready for assignment.
SELECT 
    p.full_name,
    p.role,
    p.skill,
    p.is_active,
    p.is_available,
    COALESCE(p.minimum_price, 0) as min_price,
    COALESCE(ba.is_verified, false) as bank_verified,
    CASE 
        WHEN NOT COALESCE(p.is_active, true) THEN '❌ Inactive'
        WHEN NOT COALESCE(p.is_available, true) THEN '❌ Busy'
        WHEN NOT COALESCE(ba.is_verified, false) THEN '❌ Missing Verified Bank'
        ELSE '✅ Ready'
    END as status_summary
FROM public.profiles p
LEFT JOIN public.bank_accounts ba ON ba.worker_id = p.id
WHERE p.role NOT IN ('client', 'admin')
ORDER BY status_summary DESC, p.full_name;

-- 3. RESET QUEUED PROJECTS (Optional)
-- Run this if you want to retry matching for projects that were queued.
-- UPDATE projects SET status = 'pending' WHERE status = 'queued';
