-- ======================================================
-- ROLE-BASED PROJECT ASSIGNMENT FIX
-- ======================================================

-- 1. EXTEND USER ROLES & FIX CONSTRAINTS
-- Drop the restrictive text-based check if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new values to the enum
DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE 'designer';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE 'developer';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE 'video_editor';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE 'print_specialist';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Re-add the constraint with the new roles included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role::text IN ('client', 'admin', 'worker', 'graphic_designer', 'web_designer', 'designer', 'developer', 'video_editor', 'print_specialist'));

-- 2. REFINED SERVICE AVAILABILITY
-- This function now strictly matches services to their required roles.
DROP FUNCTION IF EXISTS public.check_service_availability();
CREATE OR REPLACE FUNCTION public.check_service_availability()
RETURNS TABLE (
    service_id TEXT,
    service_title TEXT,
    service_description TEXT,
    service_icon TEXT,
    is_available BOOLEAN,
    available_worker_count INTEGER,
    required_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as service_id,
        s.title as service_title,
        s.description as service_description,
        s.icon as service_icon,
        (COUNT(p.id) > 0) as is_available,
        COUNT(p.id)::INTEGER as available_worker_count,
        CASE 
            WHEN s.id IN ('graphic_design', 'web_design', 'ui_ux') THEN 'designer'
            WHEN s.id = 'print_specialist' THEN 'print_specialist'
            ELSE 'worker'
        END as required_role
    FROM public.services s
    LEFT JOIN public.profiles p ON (
        p.is_available = true AND
        p.is_verified = true AND
        (
            -- Strict role matching
            (s.id IN ('graphic_design', 'web_design', 'ui_ux') AND p.role = 'designer') OR
            (s.id = 'print_specialist' AND p.role = 'print_specialist')
        ) AND
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

-- 3. REFINED AUTO-ASSIGNMENT LOGIC
-- This function strictly assigns workers based on their specialized roles.
DROP FUNCTION IF EXISTS public.auto_assign_worker(TEXT);
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role user_role_enum;
BEGIN
    -- Map project category to strictly defined roles
    IF project_category IN ('graphic_design', 'web_design', 'ui_ux') THEN
        target_role := 'designer';
    ELSIF project_category = 'print_specialist' THEN
        target_role := 'print_specialist';
    ELSE
        -- Fallback for any other services that might be added
        target_role := 'worker'; 
    END IF;

    -- SCORING ENGINE (Picking from top 3 qualified candidates)
    WITH scored_candidates AS (
        SELECT 
            p.id,
            public.calculate_worker_score(p.id, project_category) as score
        FROM public.profiles p
        JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            p.role = target_role -- STRICTOR: Only match exact role
            AND p.is_verified = true
            AND p.is_available = true
            AND COALESCE(ws.is_probation, false) = false
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 3)
    ),
    top3 AS (
        SELECT id FROM scored_candidates ORDER BY score DESC LIMIT 3
    )
    SELECT id INTO selected_worker_id FROM top3 ORDER BY random() LIMIT 1;

    RETURN selected_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. MIGRATE EXISTING WORKERS (Optional but helpful for testing)
-- Update existing mock designers to the new 'designer' role
UPDATE public.profiles 
SET role = 'designer' 
WHERE role IN ('graphic_designer', 'web_designer');
