-- New Project and Worker System Migration
-- 1. Add minimum_price to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS minimum_price NUMERIC DEFAULT NULL;

-- 2. Add currency fields to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_ngn NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_usd NUMERIC;

-- 3. Update Project Statuses if needed (already exist in types)

-- 4. Create Portfolio/Gallery enhancements if missing
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    worker_id UUID REFERENCES public.profiles(id),
    title TEXT,
    description TEXT,
    image_url TEXT,
    website_url TEXT, -- For web design links
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Matching Logic Helper Function (Fairness Rotation)
-- This will be used in the Edge function or a new RPC
CREATE OR REPLACE FUNCTION get_eligible_workers(p_skill TEXT, p_max_budget NUMERIC)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    minimum_price NUMERIC,
    active_projects BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.full_name, 
        p.minimum_price,
        (SELECT COUNT(*) FROM projects pr WHERE pr.worker_id = p.id AND pr.status IN ('in_progress', 'active')) as active_projects
    FROM profiles p
    WHERE p.role = 'worker'
    AND p.is_available = true
    AND p.is_verified = true
    AND p.minimum_price IS NOT NULL
    AND p.minimum_price <= p_max_budget
    AND p_skill = ANY(p.skills)
    ORDER BY last_assignment_at ASC NULLS FIRST; -- Fairness rotation
END;
$$ LANGUAGE plpgsql;
