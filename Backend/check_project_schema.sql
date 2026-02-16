-- INSPECT PROJECT TABLE COLUMNS
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';
