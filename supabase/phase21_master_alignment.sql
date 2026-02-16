-- Phase 21: Master Workflow Alignment (Database)
-- This script synchronizes the schema with the 40/60 payment and AI assignment requirements.

-- 1. Expand Project Statuses
DO $$ 
BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
        'queued',
        'assigned',
        'waiting_for_client',    -- Worker submitted proposal
        'awaiting_down_payment', -- Client accepted proposal
        'work_started',          -- 40% Deposit paid
        'review_samples',        -- Worker uploaded samples
        'awaiting_final_payment',-- Client approved samples
        'completed',             -- Final payment done & Payout triggered
        'cancelled',
        'flagged'
    ));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed: %', SQLERRM;
END $$;

-- 2. Add Payment Phase tracking to projects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'down_payment_id') THEN
        ALTER TABLE public.projects ADD COLUMN down_payment_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'final_payment_id') THEN
        ALTER TABLE public.projects ADD COLUMN final_payment_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'total_paid') THEN
        ALTER TABLE public.projects ADD COLUMN total_paid NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Enhance Payments Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'phase') THEN
        ALTER TABLE public.payments ADD COLUMN phase TEXT CHECK (phase IN ('deposit_40', 'balance_60', 'full'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'recipient_code') THEN
        ALTER TABLE public.payments ADD COLUMN recipient_code TEXT;
    END IF;
END $$;

-- 4. Update Agreements to store proposed split
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'deposit_amount') THEN
        ALTER TABLE public.agreements ADD COLUMN deposit_amount NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'balance_amount') THEN
        ALTER TABLE public.agreements ADD COLUMN balance_amount NUMERIC;
    END IF;
END $$;
