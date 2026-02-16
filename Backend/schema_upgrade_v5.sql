-- PHASE 5: ADVANCED SETTINGS & SYSTEM CONTROLS

-- 1. ENHANCE PROFILES FOR ALL USERS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_comm_method TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"project_updates": true, "messages": true, "marketing": false}'::jsonb;

-- 2. ENHANCE WORKER STATS
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available'; -- 'available', 'busy', 'away'
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS portfolio_visible BOOLEAN DEFAULT true;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- 3. SYSTEM SETTINGS (Admin Controls)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Seed basic system settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
('auto_assignment_enabled', 'true'::jsonb, 'Enable or disable automatic project assignment.'),
('default_max_projects', '3'::jsonb, 'Default maximum projects a worker can handle.'),
('platform_maintenance', 'false'::jsonb, 'Put the platform in maintenance mode.')
ON CONFLICT (key) DO NOTHING;

-- 4. RLS FOR SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System settings are viewable by everyone" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
