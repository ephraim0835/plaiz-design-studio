-- Check if profiles is a table or view and get its columns
SELECT 
    table_schema, 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_name = 'profiles';

-- Check column definitions (looking for huge columns like bytea or text that might be storing images)
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles';
