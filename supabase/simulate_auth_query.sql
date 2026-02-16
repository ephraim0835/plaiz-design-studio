-- Simulate the query exactly as the app runs it (as the authenticated user)

-- 1. Set the user ID (mimicking the auth.uid() function)
-- User ID: d56fb592-bc00-4485-a822-8787158040ab
SELECT set_config('request.jwt.claim.sub', 'd56fb592-bc00-4485-a822-8787158040ab', false);

-- 2. Switch to the 'authenticated' role (how the app connects)
SET ROLE authenticated;

-- 3. Run the profile query
-- If this hangs or errors, we know it's an RLS issue specific to this user/role
EXPLAIN ANALYZE SELECT * FROM public.profiles WHERE id = 'd56fb592-bc00-4485-a822-8787158040ab';

-- 4. Reset role (optional, for cleanup)
RESET ROLE;
