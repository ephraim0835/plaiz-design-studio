-- Phase 19: Message Deletion Policy
-- Allow users to delete their own messages

-- 1. Enable deletion for the sender
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
    
    CREATE POLICY "Users can delete own messages" 
    ON public.messages 
    FOR DELETE
    USING (auth.uid() = sender_id);
END $$;

-- 2. (Optional) Allow Admins to delete any message
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
    
    CREATE POLICY "Admins can delete any message" 
    ON public.messages 
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
END $$;
