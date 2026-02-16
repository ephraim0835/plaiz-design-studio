-- MASTER FIX: AVAILABILITY TOGGLE & ENUM ERRORS
-- This script fixes the "Failed to update availability status" error by:
-- 1. Creating missing helper functions.
-- 2. Removing invalid 'worker' enum comparisons that cause crashes.

-- STEP 1: HELPER FUNCTIONS (Safe to run even if they exist)
CREATE OR REPLACE FUNCTION public.increment_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = COALESCE(active_projects, 0) + 1,
        total_projects = COALESCE(total_projects, 0) + 1,
        updated_at = NOW()
    WHERE worker_id = worker_id_param;
    
    IF NOT FOUND THEN
        INSERT INTO public.worker_stats (worker_id, active_projects, total_projects)
        VALUES (worker_id_param, 1, 1);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = GREATEST(COALESCE(active_projects, 0) - 1, 0),
        updated_at = NOW()
    WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 2: FIX TOGGLE FUNCTION (Remove 'worker' check)
CREATE OR REPLACE FUNCTION public.toggle_worker_availability(new_status BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    worker_role user_role_enum;
    matching_project RECORD;
    result JSONB;
BEGIN
    -- 1. Update Profile
    UPDATE public.profiles 
    SET is_available = new_status 
    WHERE id = auth.uid()
    RETURNING role INTO worker_role;

    result := jsonb_build_object('available', new_status, 'assigned_project', null);

    -- 2. If becoming Available, check Queue
    IF new_status = true THEN
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status = 'queued'
        AND (
            (worker_role = 'web_designer' AND project_type = 'web_design') OR
            (worker_role = 'graphic_designer' AND project_type = 'graphic_design')
            -- FIXED: Removed invalid OR (worker_role = 'worker') check
        )
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF matching_project.id IS NOT NULL THEN
            UPDATE public.projects
            SET 
                worker_id = auth.uid(),
                status = 'in_progress',
                updated_at = NOW()
            WHERE id = matching_project.id;
            
            PERFORM public.increment_worker_active_projects(auth.uid());
            
            result := jsonb_build_object(
                'available', new_status, 
                'assigned_project', matching_project.id,
                'project_title', matching_project.title
            );
        END IF;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 3: FIX AUTO-ASSIGN FUNCTION (Remove 'worker' check)
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role user_role_enum;
BEGIN
    IF project_category = 'web_design' THEN
        target_role := 'web_designer';
    ELSE
        target_role := 'graphic_designer';
    END IF;

    WITH scored_candidates AS (
        SELECT 
            p.id,
            public.calculate_worker_score(p.id, project_category) as score
        FROM public.profiles p
        JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            p.role = target_role -- FIXED: Removed OR p.role = 'worker'
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
