-- RLS FIX: Ensure Admin can see everything
-- Run this in your Supabase SQL Editor.

-- 1. Enable RLS on worker_stats (if not already)
ALTER TABLE public.worker_stats ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Worker stats are viewable by everyone" ON public.worker_stats;
DROP POLICY IF EXISTS "Admins can manage all worker stats" ON public.worker_stats;

-- 3. Create permissive policies for Admins
CREATE POLICY "Everyone can view worker stats" 
ON public.worker_stats FOR SELECT 
USING (true);

CREATE POLICY "Admins can do everything on worker stats" 
ON public.worker_stats FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Ensure profiles are also viewable
-- (Wait, profiles should already have RLS, but let's make sure Admins can see all)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
