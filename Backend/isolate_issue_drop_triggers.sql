-- NUCLEAR OPTION: DROP ALL TRIGGERS
-- This will allow us to see if the "Database Error" is actually caused by the trigger 
-- or if it is a fundamental Auth issue (like email settings or connection).

-- 1. Drop the main user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function to be sure
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Drop any other potential triggers involving profiles
DROP TRIGGER IF EXISTS trigger_create_worker_stats ON public.profiles;

-- After running this, try to register. 
-- If it WORKS: The issue is definitely in the PL/PGSQL logic.
-- If it FAILS: The issue is NOT in the database code (it's likely Supabase Config or Network).
