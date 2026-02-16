-- FIX PERMISSIONS
-- Run this to ensure Clients can submit projects.

-- 1. Enable RLS (if not already)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Allow Clients to Insert Projects
-- Drop first to avoid conflict if exists with same name
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for users based on client_id" ON public.projects;

CREATE POLICY "Allow authenticated users to insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Create Policy: Allow Clients to View Own Projects
DROP POLICY IF EXISTS "Enable read access for users based on client_id" ON public.projects;

CREATE POLICY "Allow users to view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
    auth.uid() = client_id OR 
    auth.uid() = worker_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Create Policy: Allow Updates (for Admin/Workers)
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.projects;

CREATE POLICY "Allow updates for involved parties"
ON public.projects
FOR UPDATE
TO authenticated
USING (
    auth.uid() = client_id OR 
    auth.uid() = worker_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
