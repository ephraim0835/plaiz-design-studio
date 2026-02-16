-- QUEUE SYSTEM & WORKER AVAILABILITY V2 (Robust)
-- This script handles cases where 'status' is a TEXT column instead of an ENUM.

-- 1. ADD 'queued' STATUS SUPPORT
-- We use a DO block to check if we need to update a text constraint.
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check column type
    SELECT data_type INTO col_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'status';
    
    IF col_type = 'text' OR col_type = 'character varying' THEN
        -- It's a text column, so we update the check constraint to allow 'queued'
        -- We drop the likely existing constraint and add a new comprehensive one
        ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
        ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
            CHECK (status IN ('pending', 'in_progress', 'queued', 'review', 'completed', 'cancelled', 'flagged'));
    END IF;
END $$;

-- NOTE: If you ARE using an ENUM type named 'project_status_enum', run this command separately:
-- ALTER TYPE project_status_enum ADD VALUE IF NOT EXISTS 'queued';

-- 2. UPDATE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;

-- 3. UPDATE AUTO-ASSIGN WORKER FUNCTION
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
    AND COALESCE(p.is_available, false) = true -- MUST BE AVAILABLE
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

-- 4. UPDATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.trigger_auto_assign_on_new_project()
RETURNS TRIGGER AS $$
DECLARE
    found_worker_id UUID;
BEGIN
    -- Only run for pending projects with no worker
    IF NEW.status = 'pending' AND NEW.worker_id IS NULL THEN
        -- Try to find a worker
        found_worker_id := public.auto_assign_worker(NEW.project_type::TEXT);
        
        IF found_worker_id IS NOT NULL THEN
            NEW.worker_id := found_worker_id;
            NEW.status := 'in_progress';
            
            -- Increment stats directly here to be safe
            PERFORM public.increment_worker_active_projects(found_worker_id);
        ELSE
            -- NO WORKER AVALIABLE -> QUEUE IT
            NEW.status := 'queued';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TOGGLE AVAILABILITY RPC
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
        -- Find oldest queued project matching role
        -- Mapping logic mirrors auto_assign_worker: 
        -- web_designer -> web_design
        -- graphic_designer -> graphic_design
        
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status = 'queued'
        AND (
            (worker_role = 'web_designer' AND project_type = 'web_design') OR
            (worker_role = 'graphic_designer' AND project_type = 'graphic_design') OR
            (worker_role = 'worker') -- Generic worker grabs any? Or maybe fallback.
        )
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF matching_project.id IS NOT NULL THEN
            -- Assign to this worker
            UPDATE public.projects
            SET 
                worker_id = auth.uid(),
                status = 'in_progress',
                updated_at = NOW()
            WHERE id = matching_project.id;
            
            -- Increment stats
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
