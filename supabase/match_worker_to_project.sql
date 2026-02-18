-- FUTURE-PROOFED WORKER MATCHING SYSTEM (V3)
-- Synchronized with fix_worker_matching_system.sql

DROP FUNCTION IF EXISTS match_worker_to_project(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS match_worker_to_project(UUID, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_project_id UUID,
    p_skill TEXT,
    p_budget NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_skills_array TEXT[];
    v_effective_count NUMERIC;
    v_client_id UUID;
    v_project_title TEXT;
BEGIN
    -- STEP 1: Fetch Project Details
    SELECT client_id, title INTO v_client_id, v_project_title FROM projects WHERE id = p_project_id;

    -- STEP 2: Logic simplified to single skill match

    -- STEP 3: Identify Pool and Score Candidates
    WITH worker_pool AS (
        SELECT 
            p.id,
            p.full_name,
            -- Skill Match (40%)
            (CASE 
                WHEN p.skill = p_skill OR p.role = p_skill THEN 1.0
                WHEN p.learned_skills ? p_skill THEN 0.8  
                ELSE 0.0 
            END) * 0.40 AS skill_score,
            -- Rating (25%)
            (COALESCE(ws.average_rating, 4.5) / 5.0) * 0.25 AS rating_score,
            -- Experience (10%)
            (LEAST(COALESCE(ws.completed_projects, 0) / 20.0, 1.0)) * 0.10 AS exp_score,
            -- Workload (15%)
            (1.0 - (COALESCE(ws.active_projects, 0)::NUMERIC / COALESCE(ws.max_projects_limit, 5)::NUMERIC)) * 0.15 AS workload_score,
            -- Rotation (Idle-Longest-First) (10%)
            (EXTRACT(EPOCH FROM (NOW() - COALESCE(wr.last_assigned_at, '2000-01-01'::TIMESTAMPTZ))) / 86400.0) * 0.10 AS rotation_score
        FROM profiles p
        LEFT JOIN worker_stats ws ON ws.worker_id = p.id
        LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
        LEFT JOIN worker_rotation wr ON wr.worker_id = p.id AND wr.skill = p_skill
        WHERE 
            p.role NOT IN ('client', 'admin')
            AND p.is_active = true
            AND COALESCE(p.is_available, true) = true
            AND (ba.is_verified = true OR EXISTS (SELECT 1 FROM profiles WHERE id = p.id AND role = 'admin'))
            AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
            AND COALESCE(ws.is_probation, false) = false
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
            AND (p.skill = p_skill OR p.role = p_skill OR p.learned_skills ? p_skill)
    ),
    scored_workers AS (
        SELECT 
            id,
            (skill_score + rating_score + exp_score + workload_score + rotation_score) as total_score
        FROM worker_pool
        ORDER BY total_score DESC
        LIMIT 3
    )
    SELECT id INTO v_worker_id
    FROM scored_workers
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- STEP 4: Execution & Engagement
    IF v_worker_id IS NOT NULL THEN
        -- 4.1 Assign to project
        UPDATE projects 
        SET 
            worker_id = v_worker_id,
            status = 'assigned'
        WHERE id = p_project_id;

        -- 4.2 Update Rotation Tracking
        -- We still use worker_rotation for historical tracking even if logic changed
        INSERT INTO worker_rotation (skill, worker_id, last_assigned_at, assignment_count)
        VALUES (p_skill, v_worker_id, NOW(), 1)
        ON CONFLICT (worker_id, skill) 
        DO UPDATE SET
            last_assigned_at = NOW(),
            assignment_count = worker_rotation.assignment_count + 1;

        -- 4.3 Trigger Engagement (Initial Message)
        INSERT INTO messages (project_id, sender_id, content)
        VALUES (
            p_project_id,
            v_worker_id,
            'Hello! I''ve been assigned to your project "' || v_project_title || '". I''m ready to get started—let''s discuss the details!'
        );

        -- 4.4 Auditor Log
        INSERT INTO assignment_logs (project_id, worker_id, match_reason)
        VALUES (
            p_project_id,
            v_worker_id,
            'AntiGravity Definitive Match (Score-Based)'
        );

        -- 4.5 Notify worker
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (
            v_worker_id,
            'New Project Match!',
            'You have been matched with a new project: ' || v_project_title,
            'project_assigned',
            p_project_id
        ) ON CONFLICT DO NOTHING;
    ELSE
        -- Fallback: If no match, set to matching/queued
        UPDATE projects SET status = 'matching' WHERE id = p_project_id;
    END IF;
    
    RETURN v_worker_id;
END;
$$;

GRANT EXECUTE ON FUNCTION match_worker_to_project(UUID, TEXT, NUMERIC) TO authenticated;
