-- Diagnostic: Check columns of deleted_users_log
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'deleted_users_log'
ORDER BY 
    ordinal_position;
