-- 1. Update the role constraint to include 'client'
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_role_check;
ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_role_check CHECK (role IN ('admin', 'worker', 'client'));

-- 2. Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can request invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can read their own invite codes" ON invite_codes;
DROP POLICY IF EXISTS "System can update invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Public can verify invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Public can update invite codes" ON invite_codes;

-- 3. Create updated policies
-- Allow anyone to request a code (INSERT)
CREATE POLICY "Anyone can request invite codes"
    ON invite_codes
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to verify a code (SELECT)
-- This is needed because users aren't logged in yet when they verify the code
CREATE POLICY "Public can verify invite codes"
    ON invite_codes
    FOR SELECT
    USING (true); -- We filter by code AND email in the application logic

-- Allow anyone to use a code (UPDATE used status)
CREATE POLICY "Public can update invite codes"
    ON invite_codes
    FOR UPDATE
    USING (used = false); -- Only allow updating unused codes

-- 4. Ensure RLS is enabled
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
