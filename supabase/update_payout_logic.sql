-- Payout System Schema Update
-- 1. Ensure granular statuses and timestamps in payouts
ALTER TABLE public.payouts 
DROP CONSTRAINT IF EXISTS payouts_status_check;

-- Handle existing statuses to migrate to new ones if necessary
UPDATE public.payouts SET status = 'awaiting_payment' WHERE status = 'pending';
UPDATE public.payouts SET status = 'payment_verified' WHERE status = 'paid';

ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS admin_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS worker_confirmed_at TIMESTAMPTZ,
ADD CONSTRAINT payouts_status_check 
CHECK (status IN ('awaiting_payment', 'payment_sent', 'payment_verified', 'failed'));

-- 2. Create RPC for Admin to mark as paid
CREATE OR REPLACE FUNCTION public.mark_payout_as_sent(payout_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_id UUID;
    v_worker_id UUID;
BEGIN
    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can mark payouts as sent';
    END IF;

    UPDATE payouts 
    SET status = 'payment_sent',
        admin_paid_at = NOW(),
        payout_date = NOW()
    WHERE id = payout_id
    RETURNING project_id, worker_id INTO v_project_id, v_worker_id;

    -- Notify worker
    INSERT INTO notifications (user_id, title, message, type, project_id)
    VALUES (
        v_worker_id,
        'Payout Sent!',
        'Admin has processed your payout for project. Check your bank account.',
        'payout_sent',
        v_project_id
    );
    
    RETURN json_build_object('success', true, 'project_id', v_project_id);
END;
$$;

-- 3. Create RPC for Worker to confirm receipt
CREATE OR REPLACE FUNCTION public.confirm_payout_receipt(payout_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_id UUID;
    v_worker_id UUID;
BEGIN
    -- Get payout details
    SELECT project_id, worker_id INTO v_project_id, v_worker_id
    FROM payouts 
    WHERE id = payout_id;

    -- Check if the current user is the worker for this payout
    IF auth.uid() != v_worker_id THEN
        RAISE EXCEPTION 'Only the assigned worker can confirm receipt';
    END IF;

    UPDATE payouts 
    SET status = 'payment_verified',
        worker_confirmed_at = NOW()
    WHERE id = payout_id;

    RETURN json_build_object('success', true, 'project_id', v_project_id);
END;
$$;

-- 4. Ensure handle_project_completion creates the record correctly
-- (This might need to update existing trigger if it's using payout_logs instead)
-- Let's check if payout_logs is a thing or if it was a typo in the previous script.
