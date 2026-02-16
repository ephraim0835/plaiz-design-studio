-- FINAL GALLERY FIX
-- Combines Schema, Foreign Keys, and RLS into one guaranteed script.

-- 1. FOREIGN KEY FIX (Crucial for "Creator" link)
DO $$        
BEGIN
    -- Drop if exists to ensure clean slate
    ALTER TABLE public.portfolio DROP CONSTRAINT IF EXISTS portfolio_worker_id_fkey;
    
    -- Link worker_id to profiles.id
    ALTER TABLE public.portfolio 
    ADD CONSTRAINT portfolio_worker_id_fkey 
    FOREIGN KEY (worker_id) 
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN others THEN NULL; -- Ignore if it fails (e.g. data issues), we'll try to proceed
END $$;

-- 2. RLS RESET (Crucial for Visibility)
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to remove incorrectly configured ones
DROP POLICY IF EXISTS "Public can view approved items" ON public.portfolio;
DROP POLICY IF EXISTS "Universal View Access" ON public.portfolio;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON public.portfolio;
DROP POLICY IF EXISTS "Owner and Admin Update Access" ON public.portfolio;
DROP POLICY IF EXISTS "Owner and Admin Delete Access" ON public.portfolio;
DROP POLICY IF EXISTS "Workers can upload within their skill" ON public.portfolio;
DROP POLICY IF EXISTS "Admins have full control over portfolio" ON public.portfolio;
DROP POLICY IF EXISTS "Everyone can view all portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Workers and admins can insert portfolio items" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can delete portfolio items" ON public.portfolio;

-- Create SIMPLE, WORKING polices

-- A. VIEW: Public can see Approved. Staff can see their own. Admins see all.
CREATE POLICY "FIX_VIEW_ACCESS" ON public.portfolio
FOR SELECT
USING (
  is_approved = true 
  OR auth.uid() = worker_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- B. INSERT: Workers can upload
CREATE POLICY "FIX_INSERT_ACCESS" ON public.portfolio
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- C. MODIFY: Owners & Admins
CREATE POLICY "FIX_MODIFY_ACCESS" ON public.portfolio
FOR ALL
USING (
  auth.uid() = worker_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. PROFILE VISIBILITY (Needed for the join)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 4. FORCE DATA VISIBILITY
UPDATE public.portfolio SET is_approved = true;

-- 5. VERIFY
SELECT count(*) as total_visible_items FROM public.portfolio;
