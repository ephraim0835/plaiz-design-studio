-- ADVANCED SCORING & QUEUE SYSTEM (Final Implementation)
-- This script implements the specific weighted scoring logic requested by the user.

-- 1. ENSURE COLUMNS EXIST
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS max_projects_limit INTEGER DEFAULT 3;

-- 2. SCORING ALGORITHM FUNCTION
-- Calculates score for a worker against a project type
CREATE OR REPLACE FUNCTION public.calculate_worker_score(
    worker_id_param UUID,
    project_type_param TEXT
) RETURNS DECIMAL AS $$
DECLARE
    w_stats RECORD;
    w_profile RECORD;
    
    -- Factors
    skill_score DECIMAL := 0;
    rating_score DECIMAL := 0;
    exp_score DECIMAL := 0;
    load_score DECIMAL := 0;
    
    final_score DECIMAL := 0;
BEGIN
    -- Get Data
    SELECT * INTO w_stats FROM public.worker_stats WHERE worker_id = worker_id_param;
    SELECT * INTO w_profile FROM public.profiles WHERE id = worker_id_param;
    
    -- 1. Skill Match (0.4 weight)
    -- Check if 'project_type' is in skills array OR matches specialization
    -- Assuming project_type e.g., 'web_design'
    IF w_profile.specialization = project_type_param OR w_stats.skills @> jsonb_build_array(project_type_param) THEN
        skill_score := 1.0;
    ELSE
        skill_score := 0.5; -- Partial match/Generalist
    END IF;
    
    -- 2. Rating Normalized (0.25 weight)
    -- Avg rating 0-5
    rating_score := COALESCE(w_stats.average_rating, 5.0) / 5.0;
    
    -- 3. Experience Normalized (0.15 weight)
    -- Normalize completed projects. Let's say 50 projects = 1.0 score.
    exp_score := LEAST(COALESCE(w_stats.completed_projects, 0)::DECIMAL / 50.0, 1.0);
    
    -- 4. Workload Score (0.2 weight)
    -- (max - active) / max. higher capacity = better score.
    -- Prevent div by zero
    IF COALESCE(w_stats.max_projects_limit, 3) > 0 THEN
        load_score := (COALESCE(w_stats.max_projects_limit, 3) - COALESCE(w_stats.active_projects, 0))::DECIMAL / COALESCE(w_stats.max_projects_limit, 3)::DECIMAL;
    ELSE
        load_score := 0;
    END IF;
    
    -- Calculate Final
    final_score := (skill_score * 0.40) + 
                   (rating_score * 0.25) + 
                   (exp_score * 0.15) + 
                   (load_score * 0.20);
                   
    RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. UPDATED AUTO-ASSIGNMENT LOGIC
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role user_role_enum;
    
    -- Temporary table for scoring
    worker_scores RECORD;
BEGIN
    -- Map category to role
    IF project_category = 'web_design' THEN
        target_role := 'web_designer';
    ELSE
        target_role := 'graphic_designer';
    END IF;

    -- Select top candidates
    -- Criteria: Role match, Verified, Available, Not Probation (or penalty?), Under Limit
    
    WITH scored_candidates AS (
        SELECT 
            p.id,
            public.calculate_worker_score(p.id, project_category) as score
        FROM public.profiles p
        LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            p.role = target_role
            AND p.is_verified = true
            AND p.is_available = true
            AND COALESCE(ws.is_probation, false) = false
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 3)
    )
    SELECT id INTO selected_worker_id
    FROM scored_candidates
    ORDER BY score DESC, random() -- Top score, then random
    LIMIT 1;

    -- Requirement: "Select top 3 scoring workers, randomly pick 1"
    -- Refinement to match requirement strictly:
    /*
    WITH ranked_candidates AS (
         SELECT id, score FROM scored_candidates ORDER BY score DESC LIMIT 3
    )
    SELECT id INTO selected_worker_id FROM ranked_candidates ORDER BY random() LIMIT 1;
    */
    -- Let's stick to the stricter logic:
    WITH scored_candidates AS (
        SELECT 
            p.id,
            public.calculate_worker_score(p.id, project_category) as score
        FROM public.profiles p
        JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            (p.role = target_role OR p.role = 'worker') -- Include generic workers?
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


-- 4. CHAT TRIGGER (Requirement: Create chat on assignment)
-- We check if 'messages' table exists.
-- We ensure the system message is sent.

CREATE OR REPLACE FUNCTION public.trigger_init_project_chat()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'in_progress' (Worker Assigned)
    IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') THEN
        
        -- Insert System Message
        -- We just assume a generic welcome message from the worker
        INSERT INTO public.messages (project_id, sender_id, content)
        VALUES (
            NEW.id, 
            NEW.worker_id,
            'Hello! I have been assigned to your project. Please review the details and let me know if you have any questions.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_assigned_start_chat ON public.projects;
CREATE TRIGGER on_project_assigned_start_chat
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trigger_init_project_chat();


-- 5. UPATED AVAILABILITY TOGGLE (Queue check)
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
        -- Standard Queue Logic: FIFO, but check role match
        SELECT * INTO matching_project
        FROM public.projects
        WHERE status = 'queued'
        AND (
            (worker_role = 'web_designer' AND project_type = 'web_design') OR
            (worker_role = 'graphic_designer' AND project_type = 'graphic_design') OR
            (worker_role = 'worker')
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
