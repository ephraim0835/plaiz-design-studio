-- MASTER REPAIR & ULTRA MATCH (V15.0)
-- 1. Standardize Log Table
-- 2. Unlock Status Constraints
-- 3. Deploy Ultra Force Matcher (Always Pixelz)
-- 4. Recover All Queued Projects

-- STEP 1: LOG TABLE
DROP TABLE IF EXISTS public.debug_matching_logs;
CREATE TABLE public.debug_matching_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    criteria TEXT,
    status TEXT,
    match_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE public.debug_matching_logs TO authenticated, anon, service_role;

-- STEP 2: UNLOCK STATUS
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'pending', 'assigned', 'queued', 'chat_negotiation', 'pending_agreement', 
    'pending_down_payment', 'active', 'in_progress', 'ready_for_review', 
    'review', 'approved', 'awaiting_payout', 'awaiting_final_payment', 
    'completed', 'cancelled', 'flagged'
));

-- STEP 3: DEPLOY ULTRA FORCER
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'match_worker_to_project') LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT DEFAULT NULL,
    p_budget NUMERIC DEFAULT 0,
    p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_worker_name TEXT;
BEGIN
    SELECT id, full_name INTO v_worker_id, v_worker_name FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    
    INSERT INTO public.debug_matching_logs (project_id, criteria, status, match_reason)
    VALUES (p_project_id, 'ULTRA_FORCE', 'Attempting', 'Forcing Pixelz (Debug Mode)');

    IF v_worker_id IS NOT NULL AND p_project_id IS NOT NULL THEN
        UPDATE public.projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;
        INSERT INTO public.messages (project_id, sender_id, content) VALUES (p_project_id, v_worker_id, 'Project assigned to Pixelz.');
    END IF;

    RETURN v_worker_id;
END;
$$;

-- Wrapper functions
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT) RETURNS UUID AS $$ SELECT match_worker_to_project($1, 0, NULL); $$ LANGUAGE SQL SECURITY DEFINER;
CREATE OR REPLACE FUNCTION match_worker_to_project(p_skill TEXT, p_budget NUMERIC) RETURNS UUID AS $$ SELECT match_worker_to_project($1, $2, NULL); $$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_worker_to_project(TEXT, NUMERIC) TO authenticated, anon, service_role;

-- STEP 4: RECOVERY
DO $$ 
DECLARE 
    v_pixel_id UUID;
    v_proj RECORD;
BEGIN
    SELECT id INTO v_pixel_id FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    FOR v_proj IN (SELECT id FROM public.projects WHERE status = 'queued' OR worker_id IS NULL) LOOP
        UPDATE public.projects SET worker_id = v_pixel_id, status = 'assigned' WHERE id = v_proj.id;
        INSERT INTO public.messages (project_id, sender_id, content) VALUES (v_proj.id, v_pixel_id, 'Recovered and assigned.');
    END LOOP;
END $$;
