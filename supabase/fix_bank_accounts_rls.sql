-- Fix Bank Accounts RLS
-- Ensure Admins can view ALL bank accounts
-- Ensure Workers can view/edit their OWN bank accounts

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Workers can view own bank account" ON bank_accounts;
DROP POLICY IF EXISTS "Workers can insert own bank account" ON bank_accounts;
DROP POLICY IF EXISTS "Workers can update own bank account" ON bank_accounts;
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can view own bank account" ON bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank account" ON bank_accounts;
DROP POLICY IF EXISTS "Users can insert own bank account" ON bank_accounts;

-- 1. View Policy (Workers view own, Admins view all)
CREATE POLICY "view_bank_accounts"
ON bank_accounts FOR SELECT
USING (
    auth.uid() = worker_id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Insert Policy (Workers insert own)
CREATE POLICY "insert_bank_accounts"
ON bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = worker_id);

-- 3. Update Policy (Workers update own)
CREATE POLICY "update_bank_accounts"
ON bank_accounts
FOR UPDATE
USING (auth.uid() = worker_id);

-- 4. Delete Policy (Workers delete own)
CREATE POLICY "delete_bank_accounts"
ON bank_accounts
FOR DELETE
USING (auth.uid() = worker_id);
