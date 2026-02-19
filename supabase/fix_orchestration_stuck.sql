-- ====================================================================
-- ANTIGRAVITY ORCHESTRATION - STUCK PROJECT REPAIR & RPC FIX
-- Version: 2.1 (Reliability Patch)
-- ====================================================================

-- 1. MODERNIZE RPC (Make it case-insensitive and more robust)
CREATE OR REPLACE FUNCTION match_worker_v2(
    p_project_id UUID,
    p_role TEXT, -- classified role (e.g. 'graphic_designer' or 'Graphic Designer')
    p_skill_relevance TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_client_id UUID;
    v_normalized_role TEXT;
BEGIN
    -- Normalize role to snake_case
    v_normalized_role := LOWER(REPLACE(p_role, ' ', '_'));
    IF v_normalized_role = 'printing_specialist' THEN v_normalized_role := 'print_specialist'; END IF;

    SELECT client_id INTO v_client_id FROM projects WHERE id = p_project_id;

    WITH worker_pool AS (
        SELECT 
            p.id,
            -- Scoring logic
            ((CASE WHEN p.skill = ANY(p_skill_relevance) THEN 1.0 ELSE 0.0 END) * 0.40 +
             (COALESCE(ws.average_rating, 5.0) / 5.0) * 0.25 +
             (LEAST(COALESCE(ws.completed_projects, 0) / 20.0, 1.0)) * 0.10 +
             (1.0 - (COALESCE(ws.active_projects, 0)::NUMERIC / COALESCE(ws.max_projects_limit, 5)::NUMERIC)) * 0.25) as score
        FROM profiles p
        LEFT JOIN worker_stats ws ON ws.worker_id = p.id
        WHERE 
            p.role = v_normalized_role -- HARD ROLE MATCH (Normalized)
            AND p.verification_status = 'VERIFIED' -- HARD VERIFICATION GATE
            AND COALESCE(p.is_available, true) = true
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
            AND p.id != v_client_id -- Self-assignment prevention
    )
    SELECT id INTO v_worker_id 
    FROM worker_pool 
    ORDER BY score DESC 
    LIMIT 1;

    IF v_worker_id IS NOT NULL THEN
        UPDATE projects 
        SET worker_id = v_worker_id, 
            status = 'assigned',
            assignment_deadline = NOW() + INTERVAL '1 hour',
            project_type = v_normalized_role
        WHERE id = p_project_id;

        -- Notify Worker
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_worker_id, 'New Project Opportunity!', 'You have 1 hour to accept this project before it is reassigned.', 'project_assigned', p_project_id);
    ELSE
        -- NO QUEUE RULE
        UPDATE projects 
        SET status = 'NO_WORKER_AVAILABLE',
            project_type = v_normalized_role
        WHERE id = p_project_id;
        
        -- Notify Client
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_client_id, 'No Experts Available', 'Currently, no available ' || p_role || ' can take this project. Please try again later.', 'matching_failed', p_project_id);
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 2. REPAIR STUCK PROJECTS
-- Find projects stuck in 'matching' for more than 5 minutes or with Title Case types
UPDATE projects 
SET status = 'NO_WORKER_AVAILABLE', 
    rejection_reason = 'System timeout during orchestration. Admin review required.'
WHERE status = 'matching' 
  AND (created_at < NOW() - INTERVAL '5 minutes' OR project_type ~ '[A-Z]');

-- 3. LOG REPAIR RESULT
DO $$ 
BEGIN
    RAISE NOTICE 'Orchestration repair complete. Any stuck projects moved to NO_WORKER_AVAILABLE.';
END $$;
