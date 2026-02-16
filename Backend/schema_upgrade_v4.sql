-- PHASE 4: REFINED LOGIC & GALLERY SYSTEM

-- 1. UPDATE ENUMS
ALTER TYPE project_status_enum ADD VALUE IF NOT EXISTS 'flagged';

-- 2. ENHANCE PROFILES & STATS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS max_projects_limit INTEGER DEFAULT 3;

-- 3. GALLERY SYSTEM (Internal & Public)
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS for Gallery Items
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery items are public for viewing" ON public.gallery_items
    FOR SELECT USING (true);

CREATE POLICY "Workers can upload gallery items for their projects" ON public.gallery_items
    FOR INSERT WITH CHECK (
        auth.uid() = worker_id AND 
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND worker_id = auth.uid() AND status = 'completed'
        )
    );

CREATE POLICY "Admins have full control over gallery" ON public.gallery_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. REFINED AUTO-ASSIGNMENT LOGIC
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role user_role_enum;
BEGIN
    -- Map project category to role
    IF project_category = 'web_design' THEN
        target_role := 'web_designer';
    ELSE
        target_role := 'graphic_designer'; -- Default
    END IF;

    SELECT p.id INTO selected_worker_id
    FROM public.profiles p
    LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
    WHERE p.role = target_role
    AND p.is_verified = true
    AND COALESCE(ws.is_probation, false) = false
    AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 3)
    ORDER BY 
        COALESCE(ws.active_projects, 0) ASC, -- Prioritize lowest load
        COALESCE(ws.average_rating, 5.0) DESC, -- Then highest rating
        RANDOM() -- Break ties randomly
    LIMIT 1;

    RETURN selected_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER FOR AUTO-ASSIGNMENT ON NEW PROJECTS
CREATE OR REPLACE FUNCTION public.trigger_auto_assign_on_new_project()
RETURNS TRIGGER AS $$
DECLARE
    found_worker_id UUID;
BEGIN
    IF NEW.status = 'pending' AND NEW.worker_id IS NULL THEN
        -- Try to find a worker
        found_worker_id := public.auto_assign_worker(NEW.project_type::TEXT);
        
        IF found_worker_id IS NOT NULL THEN
            NEW.worker_id := found_worker_id;
            NEW.status := 'in_progress';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created_assign_worker ON public.projects;
CREATE TRIGGER on_project_created_assign_worker
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trigger_auto_assign_on_new_project();
