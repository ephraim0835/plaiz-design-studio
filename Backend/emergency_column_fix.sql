-- EMERGENCY COLUMN FIX: Force-add missing columns to existing tables
-- Run this in your Supabase SQL Editor.

-- 1. FIX PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. FIX WORKER_STATS TABLE
-- (The previous script used CREATE TABLE which does nothing if the table already exists)
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS active_projects INTEGER DEFAULT 0;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS max_projects_limit INTEGER DEFAULT 3;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS is_probation BOOLEAN DEFAULT false;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 5.00;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- 3. FIX PROJECTS TABLE
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assignment_method TEXT DEFAULT 'rules';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- 4. ENSURE SERVICES ARE SEEDED
INSERT INTO public.services (id, title, description, icon) VALUES
('graphic_design', 'Graphic Design', 'Branding, logos, and visual identity.', 'Sparkles'),
('web_design', 'Web Design', 'Modern, responsive websites and platforms.', 'Globe'),
('print_specialist', 'Print Media', 'High-quality print and physical assets.', 'Printer'),
('ui_ux', 'UI/UX Design', 'Intelligent user interfaces and experiences.', 'Layout')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;
