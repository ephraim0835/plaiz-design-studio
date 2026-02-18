-- AntiGravity Orchestration System - Schema Updates
-- This script adds fields for reassignment tracking, locked financial shares, and client priority scoring.

-- 1. Projects Table Updates
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS reassignment_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_worker_share NUMERIC,
ADD COLUMN IF NOT EXISTS payout_platform_share NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_logistics_fee NUMERIC DEFAULT 0;

-- 2. Profiles Table Updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_priority_score INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS learned_skills JSONB DEFAULT '{}'::jsonb;

-- 3. Agreements Table Updates
-- Add a flag to indicate if an agreement was an automated fallback
ALTER TABLE public.agreements
ADD COLUMN IF NOT EXISTS is_fallback_proposal BOOLEAN DEFAULT false;

-- 4. Reassignment Audit Log
CREATE TABLE IF NOT EXISTS public.project_reassignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    previous_worker_id UUID REFERENCES profiles(id),
    new_worker_id UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Helper Function to calculate 70/30 or 10% Profit Split
-- This will be used by triggers to lock financial data
CREATE OR REPLACE FUNCTION calculate_project_splits(p_total NUMERIC, p_type TEXT, p_profit NUMERIC DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_worker_share NUMERIC;
    v_platform_share NUMERIC;
BEGIN
    IF p_type = 'printing' THEN
        -- Platform takes 10% of worker's profit (p_profit = total - material cost)
        -- p_profit is passed from the worker's quote/proposal
        v_platform_share := COALESCE(p_profit, 0) * 0.10;
        v_worker_share := p_total - v_platform_share;
    ELSE
        -- Standard 80/20 Digital Split (20% of total)
        v_platform_share := p_total * 0.20;
        v_worker_share := p_total * 0.80;
    END IF;
    
    RETURN jsonb_build_object(
        'worker_share', v_worker_share,
        'platform_share', v_platform_share
    );
END;
$$ LANGUAGE plpgsql;
