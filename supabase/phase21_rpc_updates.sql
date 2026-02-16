-- Phase 21: Master Workflow - RPC Updates
-- This script updates the backend functions to handle the 40/60 workflow.

-- 1. Updated: Submit Price Proposal
-- Now calculates 40% deposit and 60% balance automatically.
CREATE OR REPLACE FUNCTION submit_price_proposal(
    p_project_id UUID,
    p_worker_id UUID,
    p_amount NUMERIC,
    p_deliverables TEXT,
    p_timeline TEXT,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agreement_id UUID;
    v_project_status TEXT;
    v_deposit NUMERIC;
    v_balance NUMERIC;
BEGIN
    -- STEP 1: Validate Project State
    SELECT status INTO v_project_status FROM projects WHERE id = p_project_id;
    
    IF v_project_status NOT IN ('assigned', 'waiting_for_client', 'pending_agreement') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project is not in a state to accept proposals.');
    END IF;

    -- STEP 2: Calculate Splits
    v_deposit := p_amount * 0.40;
    v_balance := p_amount * 0.60;

    -- STEP 3: Insert Proposal (Agreement)
    INSERT INTO agreements (
        project_id, 
        freelancer_id, 
        amount, 
        deposit_amount, 
        balance_amount,
        deliverables, 
        timeline, 
        notes, 
        freelancer_agreed, 
        client_agreed, 
        status
    )
    VALUES (
        p_project_id, 
        p_worker_id, 
        p_amount, 
        v_deposit, 
        v_balance,
        p_deliverables, 
        p_timeline, 
        p_notes, 
        true, 
        false, 
        'pending'
    )
    RETURNING id INTO v_agreement_id;

    -- STEP 4: Update Project Status
    -- New Status: waiting_for_client
    UPDATE projects 
    SET status = 'waiting_for_client',
        total_price = p_amount
    WHERE id = p_project_id;

    -- STEP 5: Emit Workflow Message
    -- This message will trigger the "Accept/Reject" UI in chat
    INSERT INTO messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (
        p_project_id, 
        p_worker_id, 
        'Worker proposed a price of ₦' || p_amount, 
        true,
        jsonb_build_object(
            'type', 'price_proposal', 
            'agreement_id', v_agreement_id, 
            'amount', p_amount,
            'deposit', v_deposit,
            'balance', v_balance,
            'notes', p_notes
        )
    );

    RETURN jsonb_build_object('success', true, 'agreement_id', v_agreement_id);
END;
$$;

-- 2. Updated: Process Client Payment Success
-- Handles both 40% Deposit and 60% Balance Phase.
CREATE OR REPLACE FUNCTION process_client_payment_success(
    p_project_id UUID,
    p_client_id UUID,
    p_transaction_ref TEXT,
    p_amount NUMERIC,
    p_phase TEXT -- 'deposit_40' or 'balance_60'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status TEXT;
    v_total_paid NUMERIC;
BEGIN
    -- STEP 1: Determine New Status based on Phase
    IF p_phase = 'deposit_40' THEN
        v_new_status := 'work_started';
    ELSIF p_phase = 'balance_60' THEN
        v_new_status := 'completed';
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid payment phase.');
    END IF;

    -- STEP 2: Update Project Status & Totals
    UPDATE projects 
    SET status = v_new_status,
        total_paid = COALESCE(total_paid, 0) + p_amount,
        down_payment_id = CASE WHEN p_phase = 'deposit_40' THEN uuid_generate_v4() ELSE down_payment_id END, -- Placeholder ID until we link real payment
        final_payment_id = CASE WHEN p_phase = 'balance_60' THEN uuid_generate_v4() ELSE final_payment_id END,
        payout_split_done = (p_phase = 'balance_60') -- Only mark split done if it's the final payment
    WHERE id = p_project_id;

    -- STEP 3: Log Payment
    INSERT INTO payments (project_id, client_id, amount, reference, status, type, phase)
    VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone', p_phase);

    -- STEP 4: Send System Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, 
        p_client_id, 
        CASE 
            WHEN p_phase = 'deposit_40' THEN 'Deposit (40%) received. Work has officially started!'
            ELSE 'Final payment (60%) received. Project completed! Your high-quality files are now unlocked. You can download them to your device from the review section below.'
        END,
        true
    );

    -- STEP 5: Notify Worker
    INSERT INTO notifications (user_id, title, message, type, project_id)
    SELECT worker_id, 
           CASE WHEN p_phase = 'deposit_40' THEN 'Deposit Received!' ELSE 'Final Payment Received!' END,
           CASE WHEN p_phase = 'deposit_40' THEN 'Client has paid the deposit. You may start work.' ELSE 'Client has paid the balance. Funds are being processed.' END,
           'payment_received',
           id
    FROM projects WHERE id = p_project_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

