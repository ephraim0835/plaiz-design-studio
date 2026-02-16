-- ============================================================================
-- WORKER REGISTRATION DEBUG & FIX
-- ============================================================================
-- This script helps debug and fix worker registration issues
-- ============================================================================

-- STEP 1: Check if the trigger function was updated correctly
-- ============================================================================
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- STEP 2: Check recent auth.users entries and their metadata
-- ============================================================================
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'role' as meta_role,
    raw_user_meta_data->>'specialization' as meta_spec,
    raw_user_meta_data->>'full_name' as meta_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- STEP 3: Check if profiles were created for recent users
-- ============================================================================
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.role as profile_role,
    p.specialization,
    CASE WHEN p.id IS NULL THEN 'NO PROFILE!' ELSE 'HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;

-- STEP 4: Create a test invite code (valid for 24 hours)
-- ============================================================================
-- This creates a code you can use for testing
INSERT INTO public.invite_codes (code, role, email, expires_at, used)
VALUES (
    '123456',  -- Easy to remember test code
    'worker',
    'test@example.com',  -- Replace with your test email
    NOW() + INTERVAL '24 hours',
    false
)
ON CONFLICT (code) DO UPDATE 
SET used = false, expires_at = NOW() + INTERVAL '24 hours';

-- STEP 5: Alternative - Disable invite code requirement temporarily
-- ============================================================================
-- Uncomment this if you want to test without invite codes
-- This modifies the RLS policy to allow anyone to insert invite codes

/*
DROP POLICY IF EXISTS "Anyone can request invite codes" ON invite_codes;
CREATE POLICY "Anyone can request invite codes"
    ON invite_codes
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their own invite codes" ON invite_codes;
CREATE POLICY "Users can read their own invite codes"
    ON invite_codes
    FOR SELECT
    USING (true);  -- Allow reading all codes for testing
*/

-- STEP 6: Check existing invite codes
-- ============================================================================
SELECT 
    code,
    role,
    email,
    created_at,
    expires_at,
    used,
    CASE 
        WHEN used THEN 'USED'
        WHEN NOW() > expires_at THEN 'EXPIRED'
        ELSE 'VALID'
    END as status
FROM public.invite_codes
ORDER BY created_at DESC
LIMIT 10;
