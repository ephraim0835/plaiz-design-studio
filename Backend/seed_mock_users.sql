-- ========================================
-- MOCK USER SEED SCRIPT
-- ========================================
-- This script creates realistic mock accounts for testing all user roles and system flows.
-- 
-- IMPORTANT: This script inserts directly into profiles and worker_stats.
-- For Supabase auth.users, you must create accounts via the Supabase Dashboard or API.
-- 
-- After running this script, create corresponding auth.users accounts with these emails:
-- - admin@test.com (Password: Admin123!)
-- - worker1@test.com through worker5@test.com (Password: Worker123!)
-- - client1@test.com through client5@test.com (Password: Client123!)
-- ========================================

-- Clean up existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.worker_stats WHERE worker_id IN (
--     SELECT id FROM public.profiles WHERE email LIKE '%@test.com'
-- );
-- DELETE FROM public.profiles WHERE email LIKE '%@test.com';

-- ========================================
-- 1. ADMIN ACCOUNT
-- ========================================

-- Note: You need to create this user in Supabase Auth first, then get the UUID
-- For now, we'll use a placeholder UUID that you'll need to replace after creating the auth user

-- Insert Admin Profile
-- REPLACE 'ADMIN_UUID_HERE' with the actual UUID from auth.users after creating admin@test.com
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
    '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder - replace with actual auth.uid
    'admin@test.com',
    'Admin User',
    'admin',
    true,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

-- ========================================
-- 2. WORKER ACCOUNTS (5 Workers)
-- ========================================

-- Worker 1: Graphics Designer (High Performer, Available)
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
    '00000000-0000-0000-0000-000000000011'::uuid,
    'worker1@test.com',
    'Sarah Martinez',
    'graphic_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '6 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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
) VALUES (
    '00000000-0000-0000-0000-000000000011'::uuid,
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
) ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    probation_ends_at = EXCLUDED.probation_ends_at,
    availability_status = EXCLUDED.availability_status,
    portfolio_visible = EXCLUDED.portfolio_visible,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 2: Web Developer (Mid-Load, Available)
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
    '00000000-0000-0000-0000-000000000012'::uuid,
    'worker2@test.com',
    'James Chen',
    'web_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '4 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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
) VALUES (
    '00000000-0000-0000-0000-000000000012'::uuid,
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
) ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    probation_ends_at = EXCLUDED.probation_ends_at,
    availability_status = EXCLUDED.availability_status,
    portfolio_visible = EXCLUDED.portfolio_visible,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 3: UI/UX Designer (Busy/Unavailable)
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
    '00000000-0000-0000-0000-000000000013'::uuid,
    'worker3@test.com',
    'Emily Rodriguez',
    'graphic_designer',
    true,
    false,
    true,
    NOW() - INTERVAL '8 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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
) VALUES (
    '00000000-0000-0000-0000-000000000013'::uuid,
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
) ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    probation_ends_at = EXCLUDED.probation_ends_at,
    availability_status = EXCLUDED.availability_status,
    portfolio_visible = EXCLUDED.portfolio_visible,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 4: Video Editor (Unverified - for testing verification filter)
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
    '00000000-0000-0000-0000-000000000014'::uuid,
    'worker4@test.com',
    'Michael Thompson',
    'graphic_designer',
    false,
    true,
    true,
    NOW() - INTERVAL '2 weeks',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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
) VALUES (
    '00000000-0000-0000-0000-000000000014'::uuid,
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
) ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    probation_ends_at = EXCLUDED.probation_ends_at,
    availability_status = EXCLUDED.availability_status,
    portfolio_visible = EXCLUDED.portfolio_visible,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- Worker 5: Writer (On Probation - for testing probation restriction)
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
    '00000000-0000-0000-0000-000000000015'::uuid,
    'worker5@test.com',
    'Olivia Parker',
    'graphic_designer',
    true,
    true,
    true,
    NOW() - INTERVAL '3 weeks',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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
) VALUES (
    '00000000-0000-0000-0000-000000000015'::uuid,
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
) ON CONFLICT (worker_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_projects = EXCLUDED.total_projects,
    completed_projects = EXCLUDED.completed_projects,
    active_projects = EXCLUDED.active_projects,
    max_projects_limit = EXCLUDED.max_projects_limit,
    is_probation = EXCLUDED.is_probation,
    probation_ends_at = EXCLUDED.probation_ends_at,
    availability_status = EXCLUDED.availability_status,
    portfolio_visible = EXCLUDED.portfolio_visible,
    skills = EXCLUDED.skills,
    updated_at = NOW();

-- ========================================
-- 3. CLIENT ACCOUNTS (5 Clients)
-- ========================================

-- Client 1
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
    '00000000-0000-0000-0000-000000000021'::uuid,
    'client1@test.com',
    'David Anderson',
    'client',
    true,
    true,
    true,
    NOW() - INTERVAL '3 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Client 2
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
    '00000000-0000-0000-0000-000000000022'::uuid,
    'client2@test.com',
    'Jennifer Lee',
    'client',
    true,
    true,
    true,
    NOW() - INTERVAL '2 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Client 3
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
    '00000000-0000-0000-0000-000000000023'::uuid,
    'client3@test.com',
    'Robert Williams',
    'client',
    true,
    true,
    true,
    NOW() - INTERVAL '5 months',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Client 4
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
    '00000000-0000-0000-0000-000000000024'::uuid,
    'client4@test.com',
    'Maria Garcia',
    'client',
    true,
    true,
    true,
    NOW() - INTERVAL '1 month',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Client 5
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
    '00000000-0000-0000-0000-000000000025'::uuid,
    'client5@test.com',
    'Thomas Brown',
    'client',
    true,
    true,
    true,
    NOW() - INTERVAL '6 weeks',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to verify all accounts were created successfully

SELECT 
    'SUMMARY' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role IN ('graphic_designer', 'web_designer') THEN 1 END) as workers,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
FROM public.profiles
WHERE email LIKE '%@test.com';

SELECT 
    'WORKERS DETAIL' as section,
    p.email,
    p.full_name,
    p.role,
    p.is_verified,
    p.is_available,
    ws.active_projects,
    ws.max_projects_limit,
    ws.average_rating,
    ws.completed_projects,
    ws.is_probation,
    ws.availability_status,
    ws.skills
FROM public.profiles p
LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.email LIKE 'worker%@test.com'
ORDER BY p.email;

SELECT 
    'CLIENTS DETAIL' as section,
    email,
    full_name,
    role,
    is_verified,
    created_at
FROM public.profiles
WHERE email LIKE 'client%@test.com'
ORDER BY email;

SELECT 
    'ADMIN DETAIL' as section,
    email,
    full_name,
    role,
    is_verified
FROM public.profiles
WHERE email = 'admin@test.com';
