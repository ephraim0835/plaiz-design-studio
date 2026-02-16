-- Portfolio Auto-Approval Setup
-- This removes the approval workflow and sets up simple RLS policies

-- 1. Set all existing items to approved
UPDATE public.portfolio
SET is_approved = true;

-- 2. Drop existing RLS policies on portfolio table
DROP POLICY IF EXISTS "Anyone can view approved portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can view their own pending items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can view all portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can insert their own portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can insert portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can update portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can delete portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can delete their own items" ON public.portfolio;

-- 3. Enable RLS
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- 4. Create new simple policies

-- Everyone can view all portfolio items (public gallery)
CREATE POLICY "Everyone can view all portfolio items"
ON public.portfolio
FOR SELECT
TO authenticated
USING (true);

-- Workers and admins can insert portfolio items
CREATE POLICY "Workers and admins can insert portfolio items"
ON public.portfolio
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = worker_id
);

-- Admins can delete any portfolio item
CREATE POLICY "Admins can delete portfolio items"
ON public.portfolio
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Workers can delete their own items
CREATE POLICY "Workers can delete own portfolio items"
ON public.portfolio
FOR DELETE
TO authenticated
USING (auth.uid() = worker_id);

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'portfolio';
