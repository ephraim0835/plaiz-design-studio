-- Add payload column to messages table for structured data (like proposals)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;

-- Ensure RLS allows access to this column (standard RLS covers all columns, but good to refresh)
-- No changes needed to policies if they use SELECT * or similar logic.

-- Refresh the schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
