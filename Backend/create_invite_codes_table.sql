-- Create invite_codes table for admin/worker registration
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_code_length CHECK (LENGTH(code) = 6)
);

-- Create index for faster lookups
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_email ON invite_codes(email);
CREATE INDEX idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (request code)
CREATE POLICY "Anyone can request invite codes"
    ON invite_codes
    FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can read their own codes
CREATE POLICY "Users can read their own invite codes"
    ON invite_codes
    FOR SELECT
    USING (email = auth.jwt() ->> 'email' OR auth.role() = 'authenticated');

-- Policy: System can update codes (mark as used)
CREATE POLICY "System can update invite codes"
    ON invite_codes
    FOR UPDATE
    USING (true);

-- Add comment
COMMENT ON TABLE invite_codes IS 'Stores invite codes for admin and worker registration with 24-hour expiration';
