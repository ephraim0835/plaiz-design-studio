-- ULTIMATE FIX: AVAILABILITY & QUEUE SYSTEM
-- This script addresses all possible causes: missing functions, invalid enums, and conflicting triggers.

-- 1. CLEANUP TRIGGERS (Prevent cascading failures)
DROP TRIGGER IF EXISTS on_project_assigned_start_chat ON public.projects; 
-- We will re-add a SAFE version later if needed, but for now, let's stabilize the toggle.

-- 2. ENSURE 'QUEUED' EXISTS IN ENUM (Safe Add)
DO $$ BEGIN
    ALTER TYPE project_status_enum ADD VALUE IF NOT EXISTS 'queued';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN OTHERS THEN null;
END $$;

-- 3. ENSURE HELPER FUNCTIONS EXIST
CREATE OR REPLACE FUNCTION public.increment_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.worker_stats (worker_id, active_projects, total_projects)
    VALUES (worker_id_param, 1, 1)
    ON CONFLICT (worker_id) 
    DO UPDATE SET 
        active_projects = COALESCE(public.worker_stats.active_projects, 0) + 1,
        total_projects = COALESCE(public.worker_stats.total_projects, 0) + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ROBUST TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION public.toggle_worker_availability(new_status BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    worker_role_val user_role_enum;
    matching_project RECORD;
    result JSONB;
BEGIN
    -- Update Profile & Get Role safely
    UPDATE public.profiles 
    SET is_available = new_status 
    WHERE id = auth.uid()
    RETURNING role INTO worker_role_val;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user %', auth.uid();
    END IF;

    result := jsonb_build_object('available', new_status, 'assigned_project', null);

    -- Queue Logic
    IF new_status = true THEN
        -- Find oldest queued project compatible with role
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status = 'queued'::project_status_enum
        AND (
            (worker_role_val = 'web_designer' AND project_type = 'web_design') OR
            (worker_role_val = 'graphic_designer' AND project_type = 'graphic_design')
        )
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If project found, assign it
        IF matching_project.id IS NOT NULL THEN
            UPDATE public.projects
            SET 
                worker_id = auth.uid(),
                status = 'in_progress'::project_status_enum,
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
    -- Capture detailed error
    RAISE EXCEPTION 'Toggle Failed: % (Ensure you ran ultimate_fix.sql)', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
