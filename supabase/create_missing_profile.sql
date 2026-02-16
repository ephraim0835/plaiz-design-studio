-- Check if profile exists for your specific user ID
-- From console: d56fb592-bc00-4485-a822-8787158040ab

-- 1. Check if this user's profile exists
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE id = 'd56fb592-bc00-4485-a822-8787158040ab';

-- 2. If the above returns nothing, create the profile
-- Get the email from auth.users
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE id = 'd56fb592-bc00-4485-a822-8787158040ab';

-- 3. Create the missing profile (run this ONLY if step 1 returned no results)
-- Replace 'YOUR_EMAIL' and 'YOUR_NAME' with the values from step 2
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES (
    'd56fb592-bc00-4485-a822-8787158040ab',
    'YOUR_EMAIL',  -- Replace with email from step 2
    'YOUR_NAME',   -- Replace with name from step 2 or your preferred name
    'admin',       -- Change to 'client', 'worker', etc. as needed
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Verify the profile was created
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE id = 'd56fb592-bc00-4485-a822-8787158040ab';
