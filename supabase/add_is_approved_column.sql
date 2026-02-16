-- Add is_approved column to portfolio table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'portfolio' 
        AND column_name = 'is_approved'
    ) THEN
        ALTER TABLE public.portfolio 
        ADD COLUMN is_approved BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added is_approved column to portfolio table';
    ELSE
        RAISE NOTICE 'is_approved column already exists';
    END IF;
END $$;

-- Set all existing items to approved so they show up immediately
UPDATE public.portfolio
SET is_approved = true
WHERE is_approved IS NULL OR is_approved = false;

-- Verify the update
SELECT id, title, is_approved, worker_id, created_at
FROM public.portfolio
ORDER BY created_at DESC;
