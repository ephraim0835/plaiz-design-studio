-- CHAT POLICY REPAIR
-- Ensures messages can be sent by both Clients and Workers.

-- 1. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for their projects" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.messages;

-- 3. Create Robust Policies
-- Policy: Allow involved parties to VIEW messages
CREATE POLICY "Users can view messages for their projects"
ON public.messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = messages.project_id
        AND (p.client_id = auth.uid() OR p.worker_id = auth.uid())
    ) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy: Allow involved parties to INSERT messages
CREATE POLICY "Users can insert messages to their projects"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
        AND (p.client_id = auth.uid() OR p.worker_id = auth.uid())
    )
);

-- 4. Grant Permissions
GRANT ALL ON TABLE public.messages TO authenticated, service_role;

-- 5. Safe Grant for Conversations (if it exists)
DO $$ 
BEGIN 
    GRANT ALL ON TABLE public.conversations TO authenticated, service_role;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping conversations permissions: %', SQLERRM;
END $$;
