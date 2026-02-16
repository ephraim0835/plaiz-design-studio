-- DEBUG SCRIPT: ISOLATE & REPORT ERROR
-- This script does two things:
-- 1. Drops the "Chat Creation" trigger in case it is crashing the transaction.
-- 2. Redefines the toggle function to catch and report the EXACT database error.

-- STEP 1: DROP POTENTIALLY FAILING TRIGGER
DROP TRIGGER IF EXISTS on_project_assigned_start_chat ON public.projects;

-- STEP 2: DEBUGGABLE TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION public.toggle_worker_availability(new_status BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    worker_role user_role_enum;
    matching_project RECORD;
    result JSONB;
    _err_msg text;
    _err_detail text;
BEGIN
    -- BLOCK A: PROFILE UPDATE
    BEGIN
        UPDATE public.profiles 
        SET is_available = new_status 
        WHERE id = auth.uid()
        RETURNING role INTO worker_role;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'User Profile Not Found for ID: %', auth.uid();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS _err_msg = MESSAGE_TEXT;
        RAISE EXCEPTION 'Profile Update Failed: %', _err_msg;
    END;

    result := jsonb_build_object('available', new_status, 'assigned_project', null);

    -- BLOCK B: QUEUE LOGIC
    IF new_status = true THEN
        BEGIN
            -- Check Queue
            SELECT * INTO matching_project
            FROM public.projects
            WHERE status = 'queued'
            AND (
                (worker_role = 'web_designer' AND project_type = 'web_design') OR
                (worker_role = 'graphic_designer' AND project_type = 'graphic_design')
            )
            ORDER BY created_at ASC
            LIMIT 1;
            
            -- Assign if found
            IF matching_project.id IS NOT NULL THEN
                UPDATE public.projects
                SET 
                    worker_id = auth.uid(),
                    status = 'in_progress',
                    updated_at = NOW()
                WHERE id = matching_project.id;
                
                -- Update Stats
                PERFORM public.increment_worker_active_projects(auth.uid());
                
                result := jsonb_build_object(
                    'available', new_status, 
                    'assigned_project', matching_project.id,
                    'project_title', matching_project.title
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS _err_msg = MESSAGE_TEXT, _err_detail = PG_EXCEPTION_DETAIL;
            -- We catch the error but return it as specific text so you can see it
            RAISE EXCEPTION 'Queue Logic Crash: % (Detail: %)', _err_msg, _err_detail;
        END;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
