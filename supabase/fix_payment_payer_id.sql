-- FIX: Handle payer_id vs client_id inconsistency in payments table
-- This ensures the RPC process_client_payment_success works without NOT NULL violations.

DO $$
BEGIN
    -- 1. Ensure payer_id exists (it seems it does but is NOT NULL)
    -- If it exists and is NOT NULL, we should make it NULLABLE if we want to use client_id instead,
    -- OR we should just rename/alias it. 
    -- Given the error, let's make payer_id nullable OR ensure we populate it.

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payer_id'
    ) THEN
        -- Make it nullable so it doesn't block inserts that use client_id
        ALTER TABLE public.payments ALTER COLUMN payer_id DROP NOT NULL;
    END IF;

    -- 2. Ensure client_id exists (which we use in the RPC)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN client_id UUID REFERENCES auth.users(id);
    END IF;

    -- 3. Update the RPC to be more robust (populate both if they exist)
END $$;

-- Re-create the RPC to handle both columns just in case
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
    v_has_payer_id BOOLEAN;
    v_has_client_id BOOLEAN;
BEGIN
    -- Check columns
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payer_id') INTO v_has_payer_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'client_id') INTO v_has_client_id;

    -- Verify/Accept Agreement
    SELECT amount INTO v_agreement_amount 
    FROM agreements 
    WHERE project_id = p_project_id AND status = 'accepted'
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_agreement_amount IS NULL THEN
        UPDATE agreements SET status = 'accepted', client_agreed = true 
        WHERE project_id = p_project_id AND status = 'pending';
    END IF;

    -- Update Project
    UPDATE projects 
    SET status = 'in_progress', 
        payout_split_done = false
    WHERE id = p_project_id;

    -- Log Payment (Dynamic SQL to handle column names)
    IF v_has_payer_id AND v_has_client_id THEN
        INSERT INTO payments (project_id, client_id, payer_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone');
    ELSIF v_has_payer_id THEN
        INSERT INTO payments (project_id, payer_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone');
    ELSE
        INSERT INTO payments (project_id, client_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone');
    END IF;

    -- Message
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (p_project_id, p_client_id, 'Payment successful. Project is now In Progress.', true);

    RETURN jsonb_build_object('success', true);
END;
$$;
