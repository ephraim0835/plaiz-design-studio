-- ============================================================================
-- SIMPLE WORKER REGISTRATION TEST
-- ============================================================================
-- Run each step separately and report any errors
-- ============================================================================

-- STEP 1: Check if handle_new_user function exists and view its code
-- ============================================================================
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Expected: Should show the function with the new logic for handling graphic_designer/web_designer


-- STEP 2: Test the function manually with sample data
-- ============================================================================
-- This simulates what happens when a user registers
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Try to insert a test profile directly (bypassing auth.users)
    INSERT INTO public.profiles (id, email, full_name, role, specialization)
    VALUES (
        test_user_id,
        'manual-test@example.com',
        'Test Worker',
        'graphic_designer'::user_role_enum,
        'graphic_designer'
    );
    
    RAISE NOTICE 'SUCCESS: Manual profile insert worked!';
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_user_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;


-- STEP 3: Check if the profiles table has all required columns
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;


-- STEP 4: Check RLS policies on profiles table
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';


-- STEP 5: Try to create a simple test user (this will trigger the function)
-- ============================================================================
-- NOTE: This will actually create a user in auth.users
-- Only run this if you want to test the trigger
/*
DO $$
DECLARE
    test_email TEXT := 'trigger-test-' || floor(random() * 10000)::text || '@example.com';
BEGIN
    -- This would normally be done by Supabase Auth
    -- We can't actually insert into auth.users from SQL
    RAISE NOTICE 'Cannot test trigger directly from SQL. Need to use Supabase Auth API.';
END $$;
*/
