-- VERIFY DATABASE SCHEMA
-- This script checks for the existence of required tables and columns.

SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('profiles', 'worker_stats', 'projects', 'gallery_items')
ORDER BY 
    table_name, column_name;

-- CHECK FOR FUNCTIONS
SELECT 
    routine_name, 
    routine_definition 
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name IN ('auto_assign_worker', 'toggle_worker_availability', 'handle_new_user');

-- CHECK FOR TRIGGERS (using a more generic query as specific trigger views vary)
SELECT event_object_table, trigger_name 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';
