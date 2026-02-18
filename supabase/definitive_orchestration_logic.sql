-- AntiGravity Orchestration - Definitive Logic (V4)
-- This script consolidates all RPCs to follow the final definitive orchestration manual.

-- 1. Helper: Calculate Project Splits (Digital 80/20, Printing 10% Profit)
CREATE OR REPLACE FUNCTION calculate_project_splits(p_total NUMERIC, p_type TEXT, p_profit NUMERIC DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_worker_share NUMERIC;
    v_platform_share NUMERIC;
BEGIN
    IF p_type = 'printing' THEN
        -- Platform takes 10% of worker's profit
        v_platform_share := COALESCE(p_profit, 0) * 0.10;
        v_worker_share := p_total - v_platform_share;
    ELSE
        -- Standard 80/20 Digital Split (20% to platform)
        v_platform_share := p_total * 0.20;
        v_worker_share := p_total * 0.80;
    END IF;
    
    RETURN jsonb_build_object(
        'worker_share', v_worker_share,
        'platform_share', v_platform_share
    );
END;
$$ LANGUAGE plpgsql;

-- 2. RPC: Confirm Agreement (Mutual Lock)
CREATE OR REPLACE FUNCTION confirm_agreement(
    p_project_id UUID,
    p_agreement_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agreement RECORD;
    v_project_type TEXT;
    v_splits JSONB;
BEGIN
    -- 1. Fetch Agreement Details
    SELECT * INTO v_agreement FROM agreements WHERE id = p_agreement_id;
    SELECT project_type INTO v_project_type FROM projects WHERE id = p_project_id;

    IF v_agreement IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agreement not found');
    END IF;

    -- 2. Calculate Financial Splits
    v_splits := calculate_project_splits(
        v_agreement.amount, 
        v_project_type, 
        (v_agreement.amount - COALESCE((v_agreement.payload->>'material_cost')::NUMERIC, 0)) -- Example profit calculation
    );

    -- 3. Lock Agreement and Project
    UPDATE agreements 
    SET status = 'accepted', 
        client_agreed = true, 
        freelancer_agreed = true 
    WHERE id = p_agreement_id;

    UPDATE projects 
    SET status = 'pending_down_payment',
        total_price = v_agreement.amount,
        payout_worker_share = (v_splits->>'worker_share')::NUMERIC,
        payout_platform_share = (v_splits->>'platform_share')::NUMERIC
    WHERE id = p_project_id;

    -- 4. Send System Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, 
        v_agreement.freelancer_id, 
        'Agreement Locked. Price: ₦' || v_agreement.amount || '. Please proceed to payment.', 
        true
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. RPC: Reject Price Proposal & Trigger Reassignment Flow
CREATE OR REPLACE FUNCTION reject_price_proposal(
    p_project_id UUID,
    p_reason TEXT DEFAULT 'Client requested changes or reassignment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project RECORD;
    v_new_reassignment_count INT;
    v_client_priority_score INT;
BEGIN
    -- 1. Fetch Project Details
    SELECT * INTO v_project FROM projects WHERE id = p_project_id;
    
    -- 2. Update Reassignment Count
    v_new_reassignment_count := COALESCE(v_project.reassignment_count, 0) + 1;
    
    -- 3. Penalty Logic: Lower Client Priority Score
    UPDATE profiles 
    SET client_priority_score = GREATEST(0, COALESCE(client_priority_score, 100) - 10)
    WHERE id = v_project.client_id;

    -- 4. Reassignment or Mediation
    IF v_new_reassignment_count >= 3 THEN
        -- FLAG FOR ADMIN MEDIATION
        UPDATE projects 
        SET status = 'stuck_in_negotiation',
            reassignment_count = v_new_reassignment_count
        WHERE id = p_project_id;

        -- Notify Admins
        INSERT INTO notifications (user_id, title, message, type, project_id)
        SELECT id, 'Project Stuck!', 'Project "' || v_project.title || '" needs mediation after 3 reassignments.', 'admin_mediation', p_project_id
        FROM profiles WHERE role = 'admin';

        RETURN jsonb_build_object('success', true, 'status', 'flagged_for_mediation');
    ELSE
        -- CLEANUP AND REASSIGN
        UPDATE projects 
        SET status = 'matching', -- Back to matching phase
            reassignment_count = v_new_reassignment_count,
            worker_id = NULL -- Reset worker
        WHERE id = p_project_id;

        -- Invalidate current agreement
        UPDATE agreements SET status = 'rejected' WHERE project_id = p_project_id AND status = 'pending';

        -- Send System Message
        INSERT INTO messages (project_id, sender_id, content, is_system_message)
        VALUES (p_project_id, v_project.client_id, 'Proposal declined. Searching for a more suitable expert... (' || v_new_reassignment_count || '/3 reassignments used)', true);

        RETURN jsonb_build_object('success', true, 'status', 'reassigning');
    END IF;
END;
$$;
