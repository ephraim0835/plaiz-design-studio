-- Debug Portfolio Table
SELECT 
    column_name, 
    data_type, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'portfolio';

-- Check current items
SELECT id, title, is_approved, worker_id, created_at
FROM public.portfolio
ORDER BY created_at DESC;
