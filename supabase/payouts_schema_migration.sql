-- Phase 16: Worker Payouts & Bank Verification
-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL, -- Storing encrypted/masked in application logic if needed, but here as TEXT
    account_name TEXT NOT NULL,
    recipient_code TEXT, -- From Paystack for transfers
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id) -- One account per worker
);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Workers can view their own account
CREATE POLICY "Workers can view own bank account"
    ON bank_accounts FOR SELECT
    USING (auth.uid() = worker_id);

-- Workers can insert their own account
CREATE POLICY "Workers can insert own bank account"
    ON bank_accounts FOR INSERT
    WITH CHECK (auth.uid() = worker_id);

-- Workers can update their own account
CREATE POLICY "Workers can update own bank account"
    ON bank_accounts FOR UPDATE
    USING (auth.uid() = worker_id);

-- Admins can view all accounts
CREATE POLICY "Admins can view all bank accounts"
    ON bank_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_worker ON bank_accounts(worker_id);

COMMENT ON TABLE bank_accounts IS 'Stores verified bank account details for worker payouts';
