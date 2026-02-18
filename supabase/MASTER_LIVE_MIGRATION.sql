-- ====================================================================
-- ANTIGRAVITY ORCHESTRATION - MASTER LIVE MIGRATION
-- Version: 1.0 (Definitive)
-- Purpose: Consolidates all schema updates, RPCs, and triggers for the 
--          AntiGravity matching and negotiation system.
-- ====================================================================

-- 1. SCHEMA UPDATES (Ensure columns exist)
-- FIX: Sync Project Status Constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'pending', 'queued', 'matching', 'assigned', 'waiting_for_client', 'awaiting_down_payment',
    'active', 'in_progress', 'work_started', 'review_samples', 'ready_for_review', 'review',
    'approved', 'awaiting_payout', 'awaiting_final_payment', 'pending_agreement',
    'pending_down_payment', 'chat_negotiation', 'stuck_in_negotiation', 'completed',
    'cancelled', 'flagged'
));

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS reassignment_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_worker_share NUMERIC,
ADD COLUMN IF NOT EXISTS payout_platform_share NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_logistics_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_type TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_priority_score INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS learned_skills JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.agreements
ADD COLUMN IF NOT EXISTS is_fallback_proposal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC;

-- Create bank_accounts table if missing
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    recipient_code TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id)
);

-- Reassignment Audit Log
CREATE TABLE IF NOT EXISTS public.project_reassignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    previous_worker_id UUID REFERENCES profiles(id),
    new_worker_id UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail for Payouts
CREATE TABLE IF NOT EXISTS public.payout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    worker_id UUID REFERENCES profiles(id),
    total_amount NUMERIC,
    business_cut NUMERIC,
    worker_cut NUMERIC,
    worker_bank_info JSONB,
    status TEXT DEFAULT 'pending_processing',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. HELPER FUNCTIONS
-- ====================================================================

-- Calculate Project Splits (Digital 80/20, Printing 10% Profit)
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

-- ====================================================================
-- 3. WORKER MATCHING SYSTEM
-- ====================================================================

CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_project_id UUID,
    p_skill TEXT,
    p_budget NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_client_id UUID;
    v_project_title TEXT;
BEGIN
    -- STEP 1: Fetch Project Details
    SELECT client_id, title INTO v_client_id, v_project_title FROM projects WHERE id = p_project_id;

    -- STEP 2: Scoring Pool
    WITH worker_pool AS (
        SELECT 
            p.id,
            -- Skill Match (40%)
            (CASE 
                WHEN p.skill = p_skill OR p.role = p_skill THEN 1.0
                WHEN p.learned_skills ? p_skill THEN 0.8  
                ELSE 0.0 
            END) * 0.40 AS skill_score,
            -- Rating (25%)
            (COALESCE(ws.average_rating, 4.5) / 5.0) * 0.25 AS rating_score,
            -- Experience (10%)
            (LEAST(COALESCE(ws.completed_projects, 0) / 20.0, 1.0)) * 0.10 AS exp_score,
            -- Workload (15%)
            (1.0 - (COALESCE(ws.active_projects, 0)::NUMERIC / COALESCE(ws.max_projects_limit, 5)::NUMERIC)) * 0.15 AS workload_score,
            -- Rotation (Idle-Longest-First) (10%)
            (EXTRACT(EPOCH FROM (NOW() - COALESCE(wr.last_assigned_at, '2000-01-01'::TIMESTAMPTZ))) / 86400.0) * 0.10 AS rotation_score
        FROM profiles p
        LEFT JOIN worker_stats ws ON ws.worker_id = p.id
        LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
        LEFT JOIN worker_rotation wr ON wr.worker_id = p.id AND wr.skill = p_skill
        WHERE 
            p.role NOT IN ('client', 'admin')
            AND p.is_active = true
            AND COALESCE(p.is_available, true) = true
            AND (ba.is_verified = true OR EXISTS (SELECT 1 FROM profiles WHERE id = p.id AND role = 'admin'))
            AND (p_budget = 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
            AND COALESCE(ws.is_probation, false) = false
            AND (p.skill = p_skill OR p.role = p_skill OR p.learned_skills ? p_skill)
    ),
    scored_workers AS (
        SELECT id, (skill_score + rating_score + exp_score + workload_score + rotation_score) as total_score
        FROM worker_pool
        ORDER BY total_score DESC LIMIT 3
    )
    SELECT id INTO v_worker_id FROM scored_workers ORDER BY RANDOM() LIMIT 1;
    
    -- STEP 4: Assignment
    IF v_worker_id IS NOT NULL THEN
        UPDATE projects SET worker_id = v_worker_id, status = 'assigned' WHERE id = p_project_id;
        
        -- Rotation Tracking
        INSERT INTO worker_rotation (skill, worker_id, last_assigned_at, assignment_count)
        VALUES (p_skill, v_worker_id, NOW(), 1)
        ON CONFLICT (worker_id, skill) DO UPDATE SET last_assigned_at = NOW(), assignment_count = worker_rotation.assignment_count + 1;

        -- Engagement Message
        INSERT INTO messages (project_id, sender_id, content)
        VALUES (p_project_id, v_worker_id, 'Hello! I am ready to get started—let''s discuss your project details!');

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, project_id)
        VALUES (v_worker_id, 'New Project Match!', 'You have been matched with: ' || v_project_title, 'project_assigned', p_project_id);
    ELSE
        UPDATE projects SET status = 'matching' WHERE id = p_project_id;
    END IF;
    
    RETURN v_worker_id;
END;
$$;

-- ====================================================================
-- 4. NEGOTIATION & PAYMENT FLOWS
-- ====================================================================

-- Confirm Agreement RPC
CREATE OR REPLACE FUNCTION confirm_agreement(p_project_id UUID, p_agreement_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_agreement RECORD;
    v_project_type TEXT;
    v_splits JSONB;
BEGIN
    SELECT * INTO v_agreement FROM agreements WHERE id = p_agreement_id;
    SELECT project_type INTO v_project_type FROM projects WHERE id = p_project_id;
    
    IF v_agreement IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Agreement not found'); END IF;

    -- Calculate splits (using 10% profit logic for printing if costs provided)
    v_splits := calculate_project_splits(v_agreement.amount, v_project_type, 
                v_agreement.amount - COALESCE(v_agreement.material_cost, 0));

    UPDATE agreements SET status = 'accepted', client_agreed = true, freelancer_agreed = true WHERE id = p_agreement_id;
    UPDATE projects SET status = 'pending_down_payment', total_price = v_agreement.amount,
        payout_worker_share = (v_splits->>'worker_share')::NUMERIC,
        payout_platform_share = (v_splits->>'platform_share')::NUMERIC
    WHERE id = p_project_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Reject & Reassign RPC
CREATE OR REPLACE FUNCTION reject_price_proposal(p_project_id UUID, p_reason TEXT DEFAULT 'Reassigned')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proj RECORD;
    v_count INT;
BEGIN
    SELECT * INTO v_proj FROM projects WHERE id = p_project_id;
    v_count := COALESCE(v_proj.reassignment_count, 0) + 1;
    
    UPDATE profiles SET client_priority_score = GREATEST(0, client_priority_score - 10) WHERE id = v_proj.client_id;

    IF v_count >= 3 THEN
        UPDATE projects SET status = 'stuck_in_negotiation', reassignment_count = v_count WHERE id = p_project_id;
        INSERT INTO notifications (user_id, title, message, type, project_id)
        SELECT id, 'Mediation Needed!', 'Project stuck after 3 reassignments.', 'admin_mediation', p_project_id
        FROM profiles WHERE role = 'admin';
        RETURN jsonb_build_object('status', 'flagged');
    ELSE
        UPDATE projects SET status = 'matching', reassignment_count = v_count, worker_id = NULL WHERE id = p_project_id;
        UPDATE agreements SET status = 'rejected' WHERE project_id = p_project_id AND status = 'pending';
        RETURN jsonb_build_object('status', 'reassigning');
    END IF;
END;
$$;

-- Submit Proposal RPC (40/60 Logic)
CREATE OR REPLACE FUNCTION submit_price_proposal(
    p_project_id UUID, p_worker_id UUID, p_amount NUMERIC, p_deliverables TEXT, p_timeline TEXT, p_notes TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_agreement_id UUID;
BEGIN
    INSERT INTO agreements (project_id, freelancer_id, amount, deposit_amount, balance_amount, deliverables, timeline, notes, freelancer_agreed, client_agreed, status)
    VALUES (p_project_id, p_worker_id, p_amount, p_amount * 0.4, p_amount * 0.6, p_deliverables, p_timeline, p_notes, true, false, 'pending')
    RETURNING id INTO v_agreement_id;

    UPDATE projects SET status = 'waiting_for_client', total_price = p_amount WHERE id = p_project_id;

    INSERT INTO messages (project_id, sender_id, content, is_system_message, payload)
    VALUES (p_project_id, p_worker_id, 'Proposal: ₦' || p_amount, true, 
            jsonb_build_object('type', 'price_proposal', 'agreement_id', v_agreement_id, 'amount', p_amount, 'deposit', p_amount * 0.4, 'balance', p_amount * 0.6));

    RETURN jsonb_build_object('success', true, 'agreement_id', v_agreement_id);
END;
$$;

-- Process Payment Success RPC
CREATE OR REPLACE FUNCTION process_client_payment_success(
    p_project_id UUID, p_client_id UUID, p_transaction_ref TEXT, p_amount NUMERIC, p_phase TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE projects SET 
        status = CASE WHEN p_phase = 'deposit_40' THEN 'work_started' ELSE 'completed' END,
        total_paid = COALESCE(total_paid, 0) + p_amount,
        payout_split_done = (p_phase = 'balance_60')
    WHERE id = p_project_id;

    INSERT INTO payments (project_id, client_id, amount, reference, status, type, phase)
    VALUES (p_project_id, p_client_id, p_amount, p_transaction_ref, 'completed', 'milestone', p_phase);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ====================================================================
-- 5. AUTOMATED TRIGGERS
-- ====================================================================

-- Handle Project Completion (Log Payouts & Portfolio)
CREATE OR REPLACE FUNCTION handle_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_bank RECORD;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Link Finished work to Portfolio
        INSERT INTO portfolio (worker_id, project_id, image_url, service_type, description)
        VALUES (NEW.worker_id, NEW.id, NEW.final_file, NEW.project_type, NEW.title || ' - Completed');

        -- Log Payout for Admin Settlement
        SELECT * INTO v_bank FROM bank_accounts WHERE worker_id = NEW.worker_id AND is_verified = true;
        IF v_bank.id IS NOT NULL THEN
            INSERT INTO payout_logs (project_id, worker_id, total_amount, business_cut, worker_cut, worker_bank_info, status)
            VALUES (NEW.id, NEW.worker_id, NEW.total_price, NEW.payout_platform_share, NEW.payout_worker_share, 
                    jsonb_build_object('bank', v_bank.bank_name, 'acc', v_bank.account_number), 'ready_for_transfer');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_on_project_complete ON projects;
CREATE TRIGGER tr_on_project_complete AFTER UPDATE OF status ON projects
FOR EACH ROW WHEN (NEW.status = 'completed') EXECUTE FUNCTION handle_project_completion();

-- Permissions
GRANT EXECUTE ON FUNCTION match_worker_to_project(UUID, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_agreement(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_price_proposal(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_price_proposal(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_client_payment_success(UUID, UUID, TEXT, NUMERIC, TEXT) TO authenticated;
