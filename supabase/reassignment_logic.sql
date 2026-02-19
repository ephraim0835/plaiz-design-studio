-- =============================================
-- Reassignment Logic (Safe & Audited)
-- Allows Clients or Workers to request reassignment
-- STRICTLY FORBIDDEN if any payment has been made.
-- =============================================

-- 1. Ensure Audit Log Table Exists
CREATE TABLE IF NOT EXISTS public.project_reassignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES auth.users(id),
    previous_worker_id UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. The Secure RPC
CREATE OR REPLACE FUNCTION request_reassignment(
    p_project_id UUID,
    p_reason TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_project_status TEXT;
    v_total_paid NUMERIC;
    v_worker_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Get project details
    SELECT status, total_paid, worker_id 
    INTO v_project_status, v_total_paid, v_worker_id
    FROM public.projects
    WHERE id = p_project_id;

    -- SECURITY CHECKS
    -- 1. Verify Payment Status
    IF COALESCE(v_total_paid, 0) > 0 THEN
        RAISE EXCEPTION 'Cannot reassign project: Payments have already been processed. Please contact support.';
    END IF;

    -- 2. Verify Status (Can't reassign if already completed or cancelled)
    IF v_project_status IN ('completed', 'cancelled', 'archive') THEN
         RAISE EXCEPTION 'Cannot reassign completed or archived projects.';
    END IF;

    -- ACTION
    -- 1. Log the reassignment
    INSERT INTO public.project_reassignments (project_id, requested_by, previous_worker_id, reason)
    VALUES (p_project_id, v_user_id, v_worker_id, p_reason);

    -- 2. Reset Project State
    UPDATE public.projects
    SET 
        status = 'matching', -- Send back to pool
        worker_id = NULL,    -- Remove current worker
        reassignment_count = COALESCE(reassignment_count, 0) + 1,
        assignment_deadline = NULL -- Reset deadline
    WHERE id = p_project_id;

    -- 3. Cancel any pending agreements
    UPDATE public.agreements
    SET status = 'cancelled'
    WHERE project_id = p_project_id AND status IN ('pending', 'revision_requested');
    
    -- 4. Notify (System Message)
    INSERT INTO public.messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, 
        v_user_id, 
        '🔄 REASSIGNMENT REQUESTED: ' || p_reason || '. The project has been returned to the matching pool.', 
        true
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION request_reassignment(UUID, TEXT) TO authenticated;

SELECT 'Reassignment logic deployed successfully ✅' as status;
