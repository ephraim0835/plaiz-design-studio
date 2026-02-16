
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
-- Updated: Submit Price Proposal
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
    SELECT status INTO v_project_status FROM projects WHERE id = p_project_id;
    IF v_project_status NOT IN ('assigned', 'waiting_for_client', 'pending_agreement') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project is not in a state to accept proposals.');
    END IF;
    v_deposit := p_amount * 0.40;
    v_balance := p_amount * 0.60;
    INSERT INTO agreements (
        project_id, freelancer_id, amount, deposit_amount, balance_amount,
        deliverables, timeline, notes, freelancer_agreed, client_agreed, status
    )
    VALUES (
        p_project_id, p_worker_id, p_amount, v_deposit, v_balance,
        p_deliverables, p_timeline, p_notes, true, false, 'pending'
    )
    RETURNING id INTO v_agreement_id;
    UPDATE projects SET status = 'waiting_for_client', total_price = p_amount WHERE id = p_project_id;
    INSERT INTO messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (
        p_project_id, p_worker_id, 'Worker proposed a price of ₦' || p_amount, true,
        jsonb_build_object('type', 'price_proposal', 'agreement_id', v_agreement_id, 'amount', p_amount, 'deposit', v_deposit, 'balance', v_balance, 'notes', p_notes)
    );
    RETURN jsonb_build_object('success', true, 'agreement_id', v_agreement_id);
END;
$$;

-- Updated: Process Client Payment Success
CREATE OR REPLACE FUNCTION process_client_payment_success(
    p_project_id UUID,
    p_client_id UUID,
    p_transaction_ref TEXT,
    p_amount NUMERIC,
    p_phase TEXT 
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status TEXT;
BEGIN
    IF p_phase = 'deposit_40' THEN
        v_new_status := 'work_started';
    ELSIF p_phase = 'balance_60' THEN
        v_new_status := 'completed';
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid payment phase.');
    END IF;
    UPDATE projects 
    SET status = v_new_status,
        total_paid = COALESCE(total_paid, 0) + p_amount,
        down_payment_id = CASE WHEN p_phase = 'deposit_40' THEN uuid_generate_v4() ELSE down_payment_id END,
        final_payment_id = CASE WHEN p_phase = 'balance_60' THEN uuid_generate_v4() ELSE final_payment_id END,
        payout_split_done = (p_phase = 'balance_60')
    WHERE id = p_project_id;
    INSERT INTO payments (project_id, client_id, amount, reference, status, type, phase)
    VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'project_milestone', p_phase);
    INSERT INTO messages (project_id, sender_id, content, is_system_message)
    VALUES (
        p_project_id, p_client_id, 
        CASE WHEN p_phase = 'deposit_40' THEN 'Deposit (40%) received. Work has officially started!'
        ELSE 'Final payment (60%) received. Project completed! Your high-quality files are now unlocked.' END,
        true
    );
    INSERT INTO notifications (user_id, title, message, type, project_id)
    SELECT worker_id, 
           CASE WHEN p_phase = 'deposit_40' THEN 'Deposit Received!' ELSE 'Final Payment Received!' END,
           CASE WHEN p_phase = 'deposit_40' THEN 'Client has paid the deposit.' ELSE 'Client has paid the balance.' END,
           'payment_received', id
    FROM projects WHERE id = p_project_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
`;

async function applyFix() {
    console.log('🚀 Applying Phase 21 RPC Updates...');
    // We can't use raw SQL directly without a specific RPC like 'exec_sql'.
    // Since I don't know if 'exec_sql' exists, I'll have to hope 'supabase db execute' can be fixed
    // OR I can use the Supabase CLI if I can get it to work.

    // Wait, let's try 'npx supabase db execute' again but with a file instead of string
    console.log('💡 Note: This script is a placeholder to show the SQL. I will use the CLI to apply the file.');
}

applyFix();
