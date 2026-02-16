-- RPC: Reject Price Proposal
-- Rejects the current agreement and resets project status so worker can submit again
CREATE OR REPLACE FUNCTION reject_price_proposal(
    p_project_id UUID,
    p_reason TEXT DEFAULT 'Client requested changes.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
BEGIN
    -- 1. Update Agreements
    UPDATE agreements 
    SET status = 'rejected',
        client_agreed = false,
        notes = notes || E'\n[System]: Rejected by client (' || p_reason || ')'
    WHERE project_id = p_project_id AND status = 'pending';

    -- 2. Revert Project Status to 'assigned' (or allow re-submission)
    UPDATE projects 
    SET status = 'assigned'
    WHERE id = p_project_id;

    -- 3. Notify Worker
    SELECT worker_id INTO v_worker_id FROM projects WHERE id = p_project_id;
    
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, 
        v_worker_id, -- Send "from" worker effectively, or system? System is better.
        'Price Proposal Declined. Please submit a new one based on client feedback.', 
        true
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
