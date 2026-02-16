-- FIX MISSING TITLE COLUMN
-- The frontend sends 'title', but the database seems to be missing it.

-- 1. Add 'title' column if it doesn't exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. If there's a 'name' column (older schema), copy data from it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='name') THEN
        RAISE NOTICE 'Found "name" column, migrating data to "title"...';
        UPDATE public.projects SET title = name WHERE title IS NULL;
    END IF;
END $$;

-- 3. Fill any remaining NULL titles so we can add a constraint later if needed
UPDATE public.projects SET title = 'Untitled Project' WHERE title IS NULL OR title = '';

-- 4. Verify the column is there
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'title';
