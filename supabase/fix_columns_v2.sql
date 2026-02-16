-- FINAL SCHEMA FIX V2
-- Run this to allow 'title' to be used instead of 'name'.

-- 1. Relax the constraint on 'name' (This caused the error)
ALTER TABLE public.projects ALTER COLUMN name DROP NOT NULL;

-- 2. Ensure 'title' exists
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 3. Ensure other fields exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'graphic_design',
ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Sync data (Backfill title from name if needed)
UPDATE public.projects 
SET title = name 
WHERE title IS NULL AND name IS NOT NULL;

-- 5. Verify (Test Insert)
-- This should work now that 'name' is not nullable
INSERT INTO public.projects (title, project_type, status)
VALUES ('Debug Test Project 2', 'graphic_design', 'pending');
