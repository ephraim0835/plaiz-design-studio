-- Phase 16: Payouts Schema
-- Create payouts table to track Paystack transfers to workers

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    transaction_reference TEXT,
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Payouts should be visible to the worker and admins
CREATE POLICY "payouts_worker_select" ON public.payouts
    FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "payouts_admin_all" ON public.payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.payouts IS 'Tracks Paystack transfers to workers for completed projects';
