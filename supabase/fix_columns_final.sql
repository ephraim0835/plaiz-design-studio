-- FINAL SCHEMA FIX
-- Run this to insure the "Insert" doesn't fail due to missing columns.

-- 1. Ensure 'title' exists (Frontend sends 'title', DB might only have 'name')
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Ensure other fields used by Frontend exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'graphic_design',
ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Sync 'name' to 'title' if 'name' exists (for legacy support)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'name') THEN
        UPDATE public.projects SET title = name WHERE title IS NULL;
    END IF;
END $$;

-- 4. Verify (Test Insert)
-- This block tries to insert a dummy row. If it fails, Supabase will show the error.
INSERT INTO public.projects (title, project_type, status)
VALUES ('Debug Test Project', 'graphic_design', 'pending');
-- (You can delete this row later, or check your dashboard to see if it appears)
