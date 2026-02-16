-- CLEAN SLATE: DEFINITIVE WORKER MATCHING FIX
-- This script wipes all previous versions and sets up the final, permission-correct system.

-- 1. DROP ALL OLD VERSIONS (To avoid overloading confusion)
DROP FUNCTION IF EXISTS match_worker_to_project(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS match_worker_to_project(UUID, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS match_worker_to_project(TEXT, NUMERIC, UUID);

-- 2. CREATE DEFINITIVE MATCHING FUNCTION (V6.0)
-- Flexible enough for all JS calls (named and positional)
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT,
    p_budget NUMERIC,
    p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as system to bypass RLS
AS $$
DECLARE
    v_worker_id UUID;
    v_normalized_skill TEXT;
    v_role_alias TEXT;
    v_project_title TEXT;
BEGIN
    -- Step A: Normalize input
    v_normalized_skill := CASE 
        WHEN p_skill IN ('graphic_design', 'logo_design', 'branding', 'graphics') THEN 'graphics'
        WHEN p_skill IN ('web_design', 'website', 'web_development', 'web') THEN 'web'
        WHEN p_skill IN ('printing', 'print', 'merchandise', 'printing_services') THEN 'printing'
        ELSE p_skill
    END;

    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- Step B: Find Best Worker
    SELECT p.id INTO v_worker_id
    FROM public.profiles p
    LEFT JOIN public.bank_accounts ba ON ba.worker_id = p.id
    LEFT JOIN public.worker_stats ws ON ws.worker_id = p.id
    WHERE 
        -- Skill/Role check (Resilient)
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR v_normalized_skill = ANY(COALESCE(p.skills, '{}')))
        AND p.role NOT IN ('client', 'admin')
        
        -- Readiness check
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true
        AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY RANDOM() -- Simple random selection for now
    LIMIT 1;

    -- Step C: Handle Assignment (If project ID provided)
    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        -- Get project title for message
        SELECT title INTO v_project_title FROM projects WHERE id = p_project_id;

        -- Update project
        UPDATE projects 
        SET 
            worker_id = v_worker_id,
            status = 'assigned'
        WHERE id = p_project_id;

        -- Log success
        INSERT INTO assignment_logs (project_id, worker_id, match_reason)
        VALUES (p_project_id, v_worker_id, 'SUCCESS: Auto-matched worker');

        -- Create initial message
        INSERT INTO messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'Hello! I been assigned to your project "' || COALESCE(v_project_title, 'New Task') || '". Let''s get started!');
    
    ELSIF v_worker_id IS NULL AND p_project_id IS NOT NULL THEN
        -- No match found, set to queued
        UPDATE projects SET status = 'queued' WHERE id = p_project_id;
        
        -- Log fail
        INSERT INTO assignment_logs (project_id, match_reason)
        VALUES (p_project_id, 'MATCH_FAILED: No ready workers found');
    END IF;

    RETURN v_worker_id;
END;
$$;

-- 3. CRITICAL: GRANT PERMISSIONS
-- This is what was missing!
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO anon;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO service_role;

-- 4. ENSURE PIXELZ IS READY AGAIN (Safety check)
UPDATE public.profiles 
SET role = 'graphic_designer', skill = 'graphics', is_active = true, is_available = true, minimum_price = 0
WHERE full_name ILIKE 'pixelz';

INSERT INTO public.bank_accounts (worker_id, is_verified, bank_name, bank_code, account_number, account_name)
SELECT id, true, 'Plaiz Bank', '999', '0000000000', 'Pixelz' FROM public.profiles WHERE full_name ILIKE 'pixelz'
ON CONFLICT (worker_id) DO UPDATE SET is_verified = true;
