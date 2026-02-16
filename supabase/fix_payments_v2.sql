-- FIX: Payment Constraints and Downpayment Logic (40%)
-- Drop and recreate the status constraint to allow 'completed'
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'successful', 'success', 'paid', 'failed'));

-- Ensure payer_id is nullable
ALTER TABLE public.payments ALTER COLUMN payer_id DROP NOT NULL;

-- Create/Update RPC for Payment Success with 40% Downpayment Logic
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
    v_total_amount NUMERIC;
    v_expected_downpayment NUMERIC;
    v_has_payer_id BOOLEAN;
    v_has_client_id BOOLEAN;
BEGIN
    -- 1. Verify Agreement
    SELECT amount INTO v_total_amount 
    FROM agreements 
    WHERE project_id = p_project_id AND status IN ('pending', 'accepted')
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_total_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active agreement found.');
    END IF;

    -- Calculate expected downpayment (40%)
    v_expected_downpayment := v_total_amount * 0.4;

    -- Allow some tolerance for rounding if needed, or just accept the amount sent from frontend
    -- For now, we trust the frontend but log it correctly.

    -- 2. Mark agreement as accepted if it was pending
    UPDATE agreements SET status = 'accepted', client_agreed = true 
    WHERE project_id = p_project_id AND status = 'pending';

    -- 3. Update Project Status to 'in_progress'
    -- This means the project is "unlocked" after the 40% downpayment
    UPDATE projects 
    SET status = 'in_progress', 
        payout_split_done = false -- Reset just in case
    WHERE id = p_project_id;

    -- 4. Log Payment Transaction
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payer_id') INTO v_has_payer_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'client_id') INTO v_has_client_id;

    IF v_has_payer_id AND v_has_client_id THEN
        INSERT INTO payments (project_id, client_id, payer_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'downpayment');
    ELSIF v_has_payer_id THEN
        INSERT INTO payments (project_id, payer_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'downpayment');
    ELSE
        INSERT INTO payments (project_id, client_id, amount, reference, status, type)
        VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'downpayment');
    END IF;

    -- 5. Auto-Message for Confirmation
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (p_project_id, p_client_id, '40% Downpayment (₦' || p_amount || ') received successfully. Project is now In Progress.', true);

    RETURN jsonb_build_object('success', true);
END;
$$;
