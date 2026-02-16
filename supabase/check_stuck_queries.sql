-- Check for stuck queries or those waiting for locks
SELECT
    pid,
    now() - query_start as duration,
    usename,
    state,
    wait_event_type,
    wait_event,
    query
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
