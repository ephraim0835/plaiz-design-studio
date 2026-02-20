-- =============================================
-- ORCHESTRATION FIX & REPAIR SCRIPT
-- 1. Updates `match_worker_v2` to be case-insensitive and robust
-- 2. Unsticks currently stuck projects
-- =============================================

-- 1. Improved Match Worker RPC
CREATE OR REPLACE FUNCTION public.match_worker_v2(p_role TEXT, p_project_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_worker_id UUID;
    v_score RECORD;
    v_role TEXT;
BEGIN
    -- Normalize Role (Handle 'Graphic Designer' vs 'graphic_designer')
    v_role := LOWER(REPLACE(p_role, ' ', '_'));

    -- Find Best Verified Worker
    SELECT 
        id,
        (
            (COALESCE(worker_stats->>'average_rating', '0')::numeric * 10) + 
            (CASE WHEN verification_status = 'VERIFIED' THEN 20 ELSE 0 END) -
            (COALESCE(worker_stats->>'active_projects', '0')::int * 5)
        ) as match_score
    INTO v_score
    FROM profiles
    WHERE 
        role = v_role::user_role_enum 
        AND verification_status = 'VERIFIED'
        AND status = 'active'
    ORDER BY match_score DESC
    LIMIT 1;

    v_worker_id := v_score.id;

    -- Update Project with Match Result
    IF v_worker_id IS NOT NULL THEN
        UPDATE projects 
        SET 
            worker_id = v_worker_id, 
            status = 'assigned',
            assignment_deadline = NOW() + INTERVAL '1 hour',
            reassignment_count = COALESCE(reassignment_count, 0) + 1,
            assignment_metadata = jsonb_build_object(
                'match_score', jsonb_build_object('total', v_score.match_score),
                'assigned_at', NOW()
            )
        WHERE id = p_project_id;
    ELSE
        -- NO WORKER FOUND -> Set Status to NO_WORKER_AVAILABLE
        UPDATE projects 
        SET 
            status = 'NO_WORKER_AVAILABLE',
            worker_id = NULL
        WHERE id = p_project_id;
    END IF;

    RETURN v_worker_id;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for any error: Log and set to NO_WORKER_AVAILABLE
    UPDATE projects 
    SET 
        status = 'NO_WORKER_AVAILABLE',
        rejection_reason = 'Matching Logic Error: ' || SQLERRM
    WHERE id = p_project_id;
    
    RETURN NULL;
END;
$$;

-- 2. UNSTICK SCRIPT (Run this once)
-- Reset any 'matching' projects older than 5 minutes to 'NO_WORKER_AVAILABLE'
UPDATE projects
SET status = 'NO_WORKER_AVAILABLE'
WHERE status = 'matching' 
AND created_at < NOW() - INTERVAL '5 minutes';

-- 3. Validation Logic
SELECT id, title, status, worker_id FROM projects WHERE status IN ('matching', 'NO_WORKER_AVAILABLE');
