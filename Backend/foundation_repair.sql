-- FOUNDATION REPAIR: Ensure all columns and tables for AI Assignment exist
-- Run this in your Supabase SQL Editor.

-- 1. PROFILES TABLE ENHANCEMENTS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. WORKER STATS TABLE
CREATE TABLE IF NOT EXISTS public.worker_stats (
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    completed_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    max_projects_limit INTEGER DEFAULT 3,
    is_probation BOOLEAN DEFAULT false,
    skills JSONB DEFAULT '[]'::jsonb,
    portfolio_summary TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed worker_stats for existing workers if missing
INSERT INTO public.worker_stats (worker_id)
SELECT id FROM public.profiles WHERE role != 'client'
ON CONFLICT (worker_id) DO NOTHING;

-- 3. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Re-seed services
INSERT INTO public.services (id, title, description, icon) VALUES
('graphic_design', 'Graphic Design', 'Branding, logos, and visual identity.', 'Sparkles'),
('web_design', 'Web Design', 'Modern, responsive websites and platforms.', 'Globe'),
('print_specialist', 'Print Media', 'High-quality print and physical assets.', 'Printer'),
('ui_ux', 'UI/UX Design', 'Intelligent user interfaces and experiences.', 'Layout')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- 4. LOGGING TABLE
CREATE TABLE IF NOT EXISTS public.assignment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RE-CREATE RPC (with icon/description support)
CREATE OR REPLACE FUNCTION public.check_service_availability()
RETURNS TABLE (
    service_id TEXT,
    service_title TEXT,
    service_description TEXT,
    service_icon TEXT,
    is_available BOOLEAN,
    available_worker_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as service_id,
        s.title as service_title,
        s.description as service_description,
        s.icon as service_icon,
        (COUNT(p.id) > 0) as is_available,
        COUNT(p.id)::INTEGER as available_worker_count
    FROM public.services s
    LEFT JOIN public.profiles p ON (
        -- Support flexible specialization matching
        (p.specialization = s.id OR p.specialization || '_design' = s.id OR p.specialization = s.id || 'er' OR p.specialization = 'generalist') AND
        p.is_verified = true AND
        p.is_available = true AND
        EXISTS (
            SELECT 1 FROM public.worker_stats ws 
            WHERE ws.worker_id = p.id 
            AND ws.is_probation = false 
            AND ws.active_projects < ws.max_projects_limit
        )
    )
    WHERE s.is_active = true
    GROUP BY s.id, s.title, s.description, s.icon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
