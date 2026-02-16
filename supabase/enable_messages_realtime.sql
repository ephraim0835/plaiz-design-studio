-- ENABLE REALTIME FOR MESSAGES TABLE
-- This script ensures that Realtime is properly configured for the messages table

-- 1. Enable Realtime publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Set REPLICA IDENTITY to FULL (required for DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 3. Verify RLS policies allow realtime subscriptions
-- (Realtime uses the authenticated user's permissions)

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'messages';
