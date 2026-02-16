-- FIX: Add missing is_system_message column to messages table
-- This column is required for the new Rejection/Proposal logic

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'is_system_message'
    ) THEN
        ALTER TABLE public.messages 
        ADD COLUMN is_system_message BOOLEAN DEFAULT false;
    END IF;
END $$;
