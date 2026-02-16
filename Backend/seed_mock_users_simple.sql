-- ========================================
-- SIMPLIFIED MOCK USER CREATION
-- ========================================
-- This script creates mock users by directly inserting into profiles and worker_stats.
-- You'll need to create the auth.users accounts manually via Supabase Dashboard.
--
-- INSTRUCTIONS:
-- 1. First, create auth users in Supabase Dashboard (Authentication → Add User)
-- 2. Copy each user's UUID after creation
-- 3. Update the UUIDs in this script
-- 4. Run this script in Supabase SQL Editor
-- ========================================

-- ALTERNATIVE: If you want to use placeholder UUIDs and update them later,
-- you can run this script as-is, then update the IDs after creating auth users.

-- ========================================
-- OPTION 1: Manual Auth User Creation
-- ========================================
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Create these users and copy their UUIDs:
--
-- 1. admin@test.com (Password: Admin123!)
-- 2. worker1@test.com (Password: Worker123!)
-- 3. worker2@test.com (Password: Worker123!)
-- 4. worker3@test.com (Password: Worker123!)
-- 5. worker4@test.com (Password: Worker123!)
-- 6. worker5@test.com (Password: Worker123!)
-- 7. client1@test.com (Password: Client123!)
-- 8. client2@test.com (Password: Client123!)
-- 9. client3@test.com (Password: Client123!)
-- 10. client4@test.com (Password: Client123!)
-- 11. client5@test.com (Password: Client123!)
--
-- Then replace the UUIDs below with the actual ones from Supabase.
-- ========================================

-- Temporarily disable triggers to avoid conflicts
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- ========================================
-- 1. ADMIN ACCOUNT
-- ========================================
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- Will be replaced with actual auth.uid after manual creation
    'admin@test.com',
    'Admin User',
    'admin',
    true,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

-- ========================================
-- 2. WORKER ACCOUNTS
-- ========================================

-- Worker 1: Graphics Designer
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'worker1@test.com',
    'Sarah Martinez',
    'graphic_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '6 months',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

-- Create worker stats for worker1
INSERT INTO public.worker_stats (
    worker_id,
    average_rating,
    total_projects,
    completed_projects,
    active_projects,
    max_projects_limit,
    is_probation,
    probation_ends_at,
    availability_status,
    portfolio_visible,
    skills,
    updated_at
)
SELECT 
    id,
    4.8,
    22,
    22,
    0,
    3,
    false,
    NULL,
    'available',
    true,
    ARRAY['graphics', 'logo design', 'branding', 'adobe illustrator', 'photoshop'],
    NOW()
FROM public.profiles
WHERE email = 'worker1@test.com'
ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    availability_status = EXCLUDED.availability_status,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 2: Web Developer
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'worker2@test.com',
    'James Chen',
    'web_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '4 months',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

INSERT INTO public.worker_stats (
    worker_id,
    average_rating,
    total_projects,
    completed_projects,
    active_projects,
    max_projects_limit,
    is_probation,
    probation_ends_at,
    availability_status,
    portfolio_visible,
    skills,
    updated_at
)
SELECT 
    id,
    4.6,
    15,
    14,
    1,
    3,
    false,
    NULL,
    'available',
    true,
    ARRAY['web development', 'frontend', 'React', 'JavaScript', 'HTML/CSS', 'responsive design'],
    NOW()
FROM public.profiles
WHERE email = 'worker2@test.com'
ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    availability_status = EXCLUDED.availability_status,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 3: UI/UX Designer (Busy)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'worker3@test.com',
    'Emily Rodriguez',
    'graphic_designer',
    true,
    false,
    true,
    NOW() - INTERVAL '8 months',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

INSERT INTO public.worker_stats (
    worker_id,
    average_rating,
    total_projects,
    completed_projects,
    active_projects,
    max_projects_limit,
    is_probation,
    probation_ends_at,
    availability_status,
    portfolio_visible,
    skills,
    updated_at
)
SELECT 
    id,
    4.9,
    28,
    25,
    3,
    3,
    false,
    NULL,
    'busy',
    true,
    ARRAY['ui design', 'ux research', 'figma', 'wireframing', 'prototyping', 'user testing'],
    NOW()
FROM public.profiles
WHERE email = 'worker3@test.com'
ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    availability_status = EXCLUDED.availability_status,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 4: Video Editor (Unverified)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'worker4@test.com',
    'Michael Thompson',
    'graphic_designer',
    false,
    true,
    true,
    NOW() - INTERVAL '2 weeks',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

INSERT INTO public.worker_stats (
    worker_id,
    average_rating,
    total_projects,
    completed_projects,
    active_projects,
    max_projects_limit,
    is_probation,
    probation_ends_at,
    availability_status,
    portfolio_visible,
    skills,
    updated_at
)
SELECT 
    id,
    5.0,
    2,
    2,
    0,
    3,
    true,
    NOW() + INTERVAL '28 days',
    'available',
    true,
    ARRAY['video editing', 'motion graphics', 'Adobe Premiere', 'After Effects', 'color grading'],
    NOW()
FROM public.profiles
WHERE email = 'worker4@test.com'
ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    availability_status = EXCLUDED.availability_status,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 5: Writer (On Probation)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    is_available,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'worker5@test.com',
    'Olivia Parker',
    'graphic_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '3 weeks',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

INSERT INTO public.worker_stats (
    worker_id,
    average_rating,
    total_projects,
    completed_projects,
    active_projects,
    max_projects_limit,
    is_probation,
    probation_ends_at,
    availability_status,
    portfolio_visible,
    skills,
    updated_at
)
SELECT 
    id,
    4.3,
    4,
    4,
    0,
    2,
    true,
    NOW() + INTERVAL '23 days',
    'available',
    true,
    ARRAY['copywriting', 'content writing', 'seo', 'blog posts', 'social media'],
    NOW()
FROM public.profiles
WHERE email = 'worker5@test.com'
ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    availability_status = EXCLUDED.availability_status,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- ========================================
-- 3. CLIENT ACCOUNTS
-- ========================================

INSERT INTO public.profiles (id, email, full_name, role, is_verified, is_available, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'client1@test.com', 'David Anderson', 'client', true, true, true, NOW() - INTERVAL '3 months', NOW()),
    (gen_random_uuid(), 'client2@test.com', 'Jennifer Lee', 'client', true, true, true, NOW() - INTERVAL '2 months', NOW()),
    (gen_random_uuid(), 'client3@test.com', 'Robert Williams', 'client', true, true, true, NOW() - INTERVAL '5 months', NOW()),
    (gen_random_uuid(), 'client4@test.com', 'Maria Garcia', 'client', true, true, true, NOW() - INTERVAL '1 month', NOW()),
    (gen_random_uuid(), 'client5@test.com', 'Thomas Brown', 'client', true, true, true, NOW() - INTERVAL '6 weeks', NOW())
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
    '=== SUMMARY ===' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role IN ('graphic_designer', 'web_designer') THEN 1 END) as workers,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
FROM public.profiles
WHERE email LIKE '%@test.com';

SELECT 
    '=== WORKERS ===' as info,
    p.email,
    p.full_name,
    p.role,
    p.is_verified,
    p.is_available,
    ws.active_projects || '/' || ws.max_projects_limit as projects,
    ws.average_rating as rating,
    ws.is_probation
FROM public.profiles p
LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.email LIKE 'worker%@test.com'
ORDER BY p.email;

SELECT 
    '=== CLIENTS ===' as info,
    email,
    full_name,
    is_verified
FROM public.profiles
WHERE email LIKE 'client%@test.com'
ORDER BY email;

SELECT 
    '=== ADMIN ===' as info,
    email,
    full_name,
    role
FROM public.profiles
WHERE email = 'admin@test.com';

-- ========================================
-- NEXT STEP: Create Auth Users Manually
-- ========================================
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Create each user with their email and password from the list above
-- The profiles will already exist, so they'll just link to the auth.users
-- ========================================
