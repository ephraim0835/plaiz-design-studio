-- Add missing columns to projects table to support new project request flow
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline_info TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Refresh schema cache (Supabase specific, happens automatically but good to note)
COMMENT ON TABLE public.projects IS 'Updated with deadline_info and service_type for role-based assignment';
