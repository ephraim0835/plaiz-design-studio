-- Investigate query performance and potential locks

-- 1. Check for active locks that might be blocking reads
SELECT 
    l.pid, 
    usename, 
    pg_blocking_pids(l.pid) as blocked_by, 
    query as blocked_query,
    mode,
    granted
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE relation = 'public.profiles'::regclass;

-- 2. Check table size and index usage
SELECT
    schemaname,
    relname,
    n_live_tup as rwo_count,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_stat_user_tables
WHERE relname = 'profiles';

-- 3. Run an EXPLAIN ANALYZE on the failing query to see execution plan
-- Replace 'YOUR_USER_ID' with '8dfa1ea5-e2ca-4038-b7c2-1053dabb9709' (from console log)
EXPLAIN ANALYZE SELECT * FROM public.profiles WHERE id = '8dfa1ea5-e2ca-4038-b7c2-1053dabb9709';
