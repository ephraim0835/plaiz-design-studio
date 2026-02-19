-- =============================================
-- Fix: submit_price_proposal RPC (Updated Signature)
-- The frontend sends p_profit for profit-based payout splits.
-- This replaces the old 6-param version with a 7-param version.
-- Run this in Supabase SQL Editor.
-- =============================================

CREATE OR REPLACE FUNCTION public.submit_price_proposal(
    p_project_id    UUID,
    p_worker_id     UUID,
    p_amount        NUMERIC,
    p_deliverables  TEXT,
    p_timeline      TEXT,
    p_notes         TEXT,
    p_profit        NUMERIC DEFAULT 0  -- AntiGravity profit for print jobs
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_agreement_id UUID;
    v_deposit      NUMERIC;
    v_balance      NUMERIC;
BEGIN
    -- 40/60 split on the total amount
    v_deposit := p_amount * 0.4;
    v_balance  := p_amount * 0.6;

    -- Reject if a pending proposal already exists
    IF EXISTS (
        SELECT 1 FROM public.agreements
        WHERE project_id = p_project_id AND status = 'pending'
    ) THEN
        -- Replace old proposal with new one
        UPDATE public.agreements
        SET amount        = p_amount,
            deposit_amount = v_deposit,
            balance_amount = v_balance,
            deliverables   = p_deliverables,
            timeline       = p_timeline,
            notes          = p_notes,
            freelancer_agreed = true,
            client_agreed  = false,
            updated_at     = NOW()
        WHERE project_id = p_project_id AND status = 'pending'
        RETURNING id INTO v_agreement_id;
    ELSE
        INSERT INTO public.agreements (
            project_id, freelancer_id, amount, deposit_amount, balance_amount,
            deliverables, timeline, notes, freelancer_agreed, client_agreed, status
        )
        VALUES (
            p_project_id, p_worker_id, p_amount, v_deposit, v_balance,
            p_deliverables, p_timeline, p_notes, true, false, 'pending'
        )
        RETURNING id INTO v_agreement_id;
    END IF;

    -- Update project status so admin & client see it
    UPDATE public.projects
    SET status      = 'waiting_for_client',
        total_price = p_amount
    WHERE id = p_project_id;

    -- Post a system message card visible in chat
    INSERT INTO public.messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (
        p_project_id,
        p_worker_id,
        'Proposal: ₦' || p_amount::TEXT,
        true,
        jsonb_build_object(
            'type',         'price_proposal',
            'agreement_id', v_agreement_id,
            'amount',       p_amount,
            'deposit',      v_deposit,
            'balance',      v_balance,
            'profit',       p_profit,
            'deliverables', p_deliverables,
            'timeline',     p_timeline
        )
    );

    RETURN jsonb_build_object('success', true, 'agreement_id', v_agreement_id);
END;
$$;

-- Grant execute to authenticated users (workers call this)
GRANT EXECUTE ON FUNCTION public.submit_price_proposal(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

SELECT 'submit_price_proposal function created/updated successfully ✅' AS status;
