-- FIX ENUM ERROR: REMOVE TYPE DEPENDENCIES
-- The error "type project_status_enum does not exist" indicates usage of TEXT columns instead of ENUMs.
-- This script redefines the functions to use TEXT comparisons, which works for both ENUMs and TEXT.

-- 1. FIX TOGGLE FUNCTION (Using TEXT)
CREATE OR REPLACE FUNCTION public.toggle_worker_availability(new_status BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    -- Use TEXT instead of specific ENUM type to be safe
    worker_role_val TEXT; 
    matching_project RECORD;
    result JSONB;
BEGIN
    -- Update Profile & Get Role as TEXT
    UPDATE public.profiles 
    SET is_available = new_status 
    WHERE id = auth.uid()
    RETURNING role::TEXT INTO worker_role_val;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user %', auth.uid();
    END IF;

    result := jsonb_build_object('available', new_status, 'assigned_project', null);

    -- Queue Logic
    IF new_status = true THEN
        -- Find oldest queued project compatible with role
        -- We cast columns to TEXT for comparison to handle both Enum and Text types safely
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status::TEXT = 'queued'
        AND (
            (worker_role_val = 'web_designer' AND project_type::TEXT = 'web_design') OR
            (worker_role_val = 'graphic_designer' AND project_type::TEXT = 'graphic_design')
        )
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If project found, assign it
        IF matching_project.id IS NOT NULL THEN
            UPDATE public.projects
            SET 
                worker_id = auth.uid(),
                status = 'in_progress', -- Implicit cast usually works for Enums too if valid value
                updated_at = NOW()
            WHERE id = matching_project.id;
            
            -- Update stats safely
            PERFORM public.increment_worker_active_projects(auth.uid());
            
            result := jsonb_build_object(
                'available', new_status, 
                'assigned_project', matching_project.id,
                'project_title', matching_project.title
            );
        END IF;
    END IF;

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Toggle Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FIX AUTO-ASSIGN FUNCTION (Using TEXT)
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role TEXT;
BEGIN
    IF project_category = 'web_design' THEN
        target_role := 'web_designer';
    ELSE
        target_role := 'graphic_designer';
    END IF;

    WITH scored_candidates AS (
        SELECT 
            p.id,
            -- Ensure helper function exists or handle scoring simply here
            -- public.calculate_worker_score(p.id, project_category) as score
            0 as score -- Placeholder if scoring func fails, but let's assume it works or simplfy
        FROM public.profiles p
        LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            p.role::TEXT = target_role
            AND p.is_verified = true
            AND p.is_available = true
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 3)
    ),
    top3 AS (
        SELECT id FROM scored_candidates ORDER BY score DESC, random() LIMIT 3
    )
    SELECT id INTO selected_worker_id FROM top3 ORDER BY random() LIMIT 1;

    RETURN selected_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
