-- Add website_link column to portfolio table
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS website_link TEXT;

-- Update RLS if necessary (usually 'FOR ALL' covers it, but good to be sure)
-- The existing policy "Workers can manage their own portfolio" already uses FOR ALL.
