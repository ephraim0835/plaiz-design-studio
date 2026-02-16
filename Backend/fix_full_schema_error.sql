-- FINAL SCHEMA FIX: CORRECT COLUMN NAMES & TYPES
-- The column is 'service_type', not 'project_type'.
-- The types are being treated as TEXT to avoid Enum errors.

-- 1. FIX TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION public.toggle_worker_availability(new_status BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    worker_role_val TEXT; 
    matching_project RECORD;
    result JSONB;
BEGIN
    -- Update Profile
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
        -- Check Queue using 'service_type'
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status::TEXT = 'queued'
        AND (
            (worker_role_val = 'web_designer' AND service_type::TEXT = 'web_design') OR
            (worker_role_val = 'graphic_designer' AND service_type::TEXT = 'graphic_design')
        )
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If project found, assign it
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
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Toggle Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FIX AUTO-ASSIGN FUNCTION
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
            0 as score
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
