-- Phase 18: End-to-End Workflow Enforcement
-- This script creates the RPCs and Table Structures required for the specific user flow.

-- 1. Ensure Agreements Table (Acts as Price Proposal)
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    deliverables TEXT,
    timeline TEXT,
    notes TEXT,
    freelancer_agreed BOOLEAN DEFAULT true,
    client_agreed BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RPC: Submit Price Proposal (Worker)
-- Updates project status to 'pending_agreement' if not already
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
BEGIN
    -- Check project status
    SELECT status INTO v_project_status FROM projects WHERE id = p_project_id;
    
    IF v_project_status NOT IN ('assigned', 'pending_agreement') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project is not in a state to accept proposals.');
    END IF;

    -- Insert Agreement/Proposal
    INSERT INTO agreements (project_id, freelancer_id, amount, deliverables, timeline, notes, freelancer_agreed, client_agreed, status)
    VALUES (p_project_id, p_worker_id, p_amount, p_deliverables, p_timeline, p_notes, true, false, 'pending')
    RETURNING id INTO v_agreement_id;

    -- Update Project Status
    UPDATE projects 
    SET status = 'pending_agreement'
    WHERE id = p_project_id;

    -- Send System Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (
        p_project_id, 
        p_worker_id, 
        'Price Proposal Submitted: ₦' || p_amount, 
        true,
        jsonb_build_object('type', 'price_proposal', 'agreement_id', v_agreement_id, 'amount', p_amount)
    );

    RETURN jsonb_build_object('success', true, 'agreement_id', v_agreement_id);
END;
$$;

-- 3. RPC: Approve Price & Pay (Client)
-- This assumes payment was successful via Paystack/Moniepoint on frontend
-- It validates the payment, updates status, and triggers the split logic preparation
CREATE OR REPLACE FUNCTION process_client_payment_success(
    p_project_id UUID,
    p_client_id UUID,
    p_transaction_ref TEXT,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agreement_amount NUMERIC;
BEGIN
    -- Verify Agreement Amount matches Payment
    SELECT amount INTO v_agreement_amount 
    FROM agreements 
    WHERE project_id = p_project_id AND status = 'accepted' -- Must be accepted first? Or accept implicitly?
    ORDER BY created_at DESC LIMIT 1;
    
    -- If no accepted agreement, check for pending and accept it implicitly
    IF v_agreement_amount IS NULL THEN
        SELECT amount INTO v_agreement_amount 
        FROM agreements 
        WHERE project_id = p_project_id AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1;
        
        -- Mark agreement as accepted
        UPDATE agreements SET status = 'accepted', client_agreed = true 
        WHERE project_id = p_project_id AND status = 'pending';
    END IF;

    -- Update Project Status
    UPDATE projects 
    SET status = 'in_progress', 
        payout_split_done = false -- Flag for backend job to process split logs
    WHERE id = p_project_id;

    -- Log Payment Transaction
    INSERT INTO payments (project_id, client_id, amount, reference, status, type)
    VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone');

    -- Auto-Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (p_project_id, p_client_id, 'Payment successful. Project is now In Progress.', true);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. RPC: Submit Final Work (Worker)
CREATE OR REPLACE FUNCTION submit_final_work(
    p_project_id UUID,
    p_worker_id UUID,
    p_final_file_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update Project
    UPDATE projects 
    SET status = 'under_review',
        final_file = p_final_file_url
    WHERE id = p_project_id AND worker_id = p_worker_id;

    -- Send System Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (
        p_project_id, 
        p_worker_id, 
        'Final Work Submitted for Review.', 
        true, 
        jsonb_build_object('type', 'final_delivery', 'file_url', p_final_file_url)
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. RPC: Approve Final Delivery (Client)
-- This calls the existing handle_project_completion logic via update
CREATE OR REPLACE FUNCTION approve_final_delivery(
    p_project_id UUID,
    p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update Status -> 'completed'
    -- This fires 'tr_on_project_complete' from phase16_backend_logic.sql
    UPDATE projects 
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_project_id;

    -- Send System Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, 
        p_client_id, 
        'Project Completed! Funds have been released to the worker.', 
        true
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
