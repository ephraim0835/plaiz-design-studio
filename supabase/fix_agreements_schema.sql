-- Add missing updated_at column to agreements table
DO $$ 
BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'updated_at') THEN
        ALTER TABLE public.agreements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update agreements status constraint to include 'revision_requested'
ALTER TABLE public.agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE public.agreements ADD CONSTRAINT agreements_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'revision_requested'));

-- definitive FIX: project status constraint alignment
-- Ensures AI Orchestrator can use 'matching' and 'NO_WORKER_AVAILABLE' without violations
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'pending',
    'queued',
    'matching',
    'assigned',
    'waiting_for_client',
    'awaiting_down_payment',
    'active',
    'in_progress',
    'work_started',
    'review_samples',
    'ready_for_review',
    'review',
    'approved',
    'awaiting_payout',
    'awaiting_final_payment',
    'pending_agreement',
    'pending_down_payment',
    'chat_negotiation',
    'stuck_in_negotiation',
    'NO_WORKER_AVAILABLE',
    'completed',
    'cancelled',
    'flagged'
));

-- Re-apply submit_price_proposal with fixed signature and logic
CREATE OR REPLACE FUNCTION public.submit_price_proposal(
    p_project_id    UUID,
    p_worker_id     UUID,
    p_amount        NUMERIC,
    p_deliverables  TEXT,
    p_timeline      TEXT,
    p_notes         TEXT,
    p_profit        NUMERIC DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_agreement_id UUID;
    v_deposit      NUMERIC;
    v_balance      NUMERIC;
BEGIN
    v_deposit := p_amount * 0.4;
    v_balance := p_amount * 0.6;

    IF EXISTS (
        SELECT 1 FROM public.agreements
        WHERE project_id = p_project_id AND status = 'pending'
    ) THEN
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
            deliverables, timeline, notes, freelancer_agreed, client_agreed, status, updated_at
        )
        VALUES (
            p_project_id, p_worker_id, p_amount, v_deposit, v_balance,
            p_deliverables, p_timeline, p_notes, true, false, 'pending', NOW()
        )
        RETURNING id INTO v_agreement_id;
    END IF;

    UPDATE public.projects
    SET status      = 'waiting_for_client',
        total_price = p_amount
    WHERE id = p_project_id;

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

GRANT EXECUTE ON FUNCTION public.submit_price_proposal(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;
