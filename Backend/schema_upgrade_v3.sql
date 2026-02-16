-- PHASE 3: PLATFORM SCALABILITY & AUTOMATION

-- 0. PRE-REQUISITES (Fix for missing types)
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('client', 'graphic_designer', 'web_designer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. NEW TABLES for Worker Management & Quality Control

-- WORKER STATS: Tracks performance and probation status
CREATE TABLE IF NOT EXISTS public.worker_stats (
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    average_rating DECIMAL(3, 2) DEFAULT 5.00,
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    is_probation BOOLEAN DEFAULT true,
    probation_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- REVIEWS: Client feedback
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- PROJECT FILES: Deliverables and Resources
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'deliverable', 'resource'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. ALTER EXISTING TABLES
-- Add 'review' status support if not already covered by metadata or flexible usage
-- (Postgres Enums are hard to change in one go without recreating, so we'll handle status logic carefully in app or add a column if needed)
-- For now, we assume 'completed' implies reviewed or ready for review.

-- 3. AUTOMATION LOGIC (FUNCTIONS)

-- FUNCTION: Update Worker Stats on Project Completion/Review
CREATE OR REPLACE FUNCTION public.update_worker_stats_after_review()
RETURNS TRIGGER AS $$
DECLARE
    new_rating DECIMAL;
    total_reviews INTEGER;
BEGIN
    -- Calculate new average
    SELECT AVG(rating), COUNT(*) INTO new_rating, total_reviews
    FROM public.reviews
    WHERE worker_id = NEW.worker_id;

    -- Update stats
    INSERT INTO public.worker_stats (worker_id, average_rating, updated_at)
    VALUES (NEW.worker_id, new_rating, NOW())
    ON CONFLICT (worker_id)
    DO UPDATE SET 
        average_rating = EXCLUDED.average_rating,
        updated_at = NOW();

    -- Check probation removal (example rule: 5 reviews > 4.5 avg)
    IF total_reviews >= 5 AND new_rating >= 4.5 THEN
        UPDATE public.worker_stats SET is_probation = false WHERE worker_id = NEW.worker_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Run stats update when a review is added
DROP TRIGGER IF EXISTS on_review_added ON public.reviews;
CREATE TRIGGER on_review_added
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_worker_stats_after_review();


-- FUNCTION: Auto-Assign Worker
-- Finds the best qualified available worker with the lowest active load
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
    -- Optional: AND p.is_online = true
    ORDER BY 
        COALESCE(ws.active_projects, 0) ASC, -- Prioritize lowest load
        COALESCE(ws.average_rating, 5.0) DESC, -- Then highest rating
        COALESCE(ws.is_probation, true) ASC, -- Prefer non-probation if load is equal? Actually maybe mix them. Let's stick to load.
        RANDOM() -- Break ties randomly
    LIMIT 1;

    RETURN selected_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RLS POLICIES FOR NEW TABLES

-- Worker Stats
ALTER TABLE public.worker_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public worker stats (rating) viewable" ON public.worker_stats FOR SELECT USING (true);
CREATE POLICY "Admins manage stats" ON public.worker_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews viewable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Project Files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants view files" ON public.project_files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id 
        AND (client_id = auth.uid() OR worker_id = auth.uid())
    ) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Project participants upload files" ON public.project_files FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id 
        AND (client_id = auth.uid() OR worker_id = auth.uid())
    )
);
