-- SCHEMA STABILIZATION
-- Ensuring the projects table can accept the new fields.

-- 1. Add missing columns safely
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'graphic_design',
ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Drop "service_type" if we accidentally added it, to avoid confusion (optional)
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS service_type;
