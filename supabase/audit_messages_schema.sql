-- AUDIT MESSAGES SCHEMA
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages';

SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages';
