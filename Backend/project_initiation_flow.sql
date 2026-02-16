-- PHASE 6: SERVICE-FIRST PROJECT INITIATION
-- This script adds the services table and the dynamic availability rpc.

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed services
INSERT INTO public.services (id, title, description, icon) VALUES
('graphic_design', 'Graphic Design', 'Branding, logos, and visual identity.', 'Sparkles'),
('web_design', 'Web Design', 'Modern, responsive websites and platforms.', 'Globe'),
('print_specialist', 'Print Media', 'High-quality print and physical assets.', 'Printer'),
('ui_ux', 'UI/UX Design', 'Intelligent user interfaces and experiences.', 'Layout')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- 2. DYNAMIC AVAILABILITY RPC
-- Returns services that have at least one eligible and available worker.
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
        (p.specialization = s.id OR p.specialization || '_design' = s.id OR p.specialization = s.id || 'er') AND
        p.role IN ('graphic_designer', 'web_designer', 'worker') AND
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

-- 3. UPDATE PROFILES CONSTRAINT
-- Ensure specialization values can handle the new IDs.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_specialization;
ALTER TABLE public.profiles ADD CONSTRAINT valid_specialization 
CHECK (
    specialization IS NULL OR 
    specialization IN ('graphic_design', 'web_designer', 'graphic_designer', 'web_design', 'print_specialist', 'ui_ux')
);

-- 4. RLS FOR SERVICES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Only admins manage services" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
