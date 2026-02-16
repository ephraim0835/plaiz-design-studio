-- ========================================
-- QUICK MOCK USER SETUP
-- ========================================
-- This creates test user profiles that you can link to auth users
-- Run this in Supabase SQL Editor
--
-- Worker Roles:
-- - graphic_designer: Brand identity, logos, marketing materials
-- - web_designer: Websites, web apps, responsive design
-- - print_specialist: Print materials, packaging, production
-- ========================================

-- Create profiles (these will be linked when you create auth users)
DO $$
DECLARE
    admin_id UUID;
    worker1_id UUID;
    worker2_id UUID;
    worker3_id UUID;
    worker4_id UUID;
    worker5_id UUID;
BEGIN
    -- Temporarily disable triggers
    ALTER TABLE public.profiles DISABLE TRIGGER ALL;
    
    -- Admin
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('admin@test.com', 'Admin User', 'admin', true, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
    RETURNING id INTO admin_id;
    
    -- Worker 1: Graphic Designer (High Performer, Available)
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('worker1@test.com', 'Sarah Martinez', 'graphic_designer', true, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
    RETURNING id INTO worker1_id;
    
    INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, completed_projects, active_projects, max_projects_limit, is_probation, skills)
    VALUES (worker1_id, 4.8, 22, 22, 0, 3, false, ARRAY['logo design', 'branding', 'marketing materials', 'adobe illustrator'])
    ON CONFLICT (worker_id) DO UPDATE SET average_rating = EXCLUDED.average_rating, active_projects = EXCLUDED.active_projects;
    
    -- Worker 2: Web Designer (Mid-Load, Available)
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('worker2@test.com', 'James Chen', 'web_designer', true, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
    RETURNING id INTO worker2_id;
    
    INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, completed_projects, active_projects, max_projects_limit, is_probation, skills)
    VALUES (worker2_id, 4.6, 15, 14, 1, 3, false, ARRAY['web development', 'React', 'responsive design', 'web apps'])
    ON CONFLICT (worker_id) DO UPDATE SET average_rating = EXCLUDED.average_rating, active_projects = EXCLUDED.active_projects;
    
    -- Worker 3: Print Specialist (Busy/Unavailable)
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('worker3@test.com', 'Emily Rodriguez', 'print_specialist', true, false, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_available = EXCLUDED.is_available
    RETURNING id INTO worker3_id;
    
    INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, completed_projects, active_projects, max_projects_limit, is_probation, availability_status, skills)
    VALUES (worker3_id, 4.9, 28, 25, 3, 3, false, 'busy', ARRAY['print materials', 'packaging', 'production', 'offset printing'])
    ON CONFLICT (worker_id) DO UPDATE SET average_rating = EXCLUDED.average_rating, active_projects = EXCLUDED.active_projects, availability_status = EXCLUDED.availability_status;
    
    -- Worker 4: Graphic Designer (Unverified - for testing verification filter)
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('worker4@test.com', 'Michael Thompson', 'graphic_designer', false, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_verified = EXCLUDED.is_verified
    RETURNING id INTO worker4_id;
    
    INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, completed_projects, active_projects, max_projects_limit, is_probation, skills)
    VALUES (worker4_id, 5.0, 2, 2, 0, 3, true, ARRAY['illustration', 'digital art', 'brand identity'])
    ON CONFLICT (worker_id) DO UPDATE SET average_rating = EXCLUDED.average_rating, is_probation = EXCLUDED.is_probation;
    
    -- Worker 5: Web Designer (On Probation - for testing probation restriction)
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES ('worker5@test.com', 'Olivia Parker', 'web_designer', true, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
    RETURNING id INTO worker5_id;
    
    INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, completed_projects, active_projects, max_projects_limit, is_probation, skills)
    VALUES (worker5_id, 4.3, 4, 4, 0, 2, true, ARRAY['frontend development', 'HTML/CSS', 'JavaScript'])
    ON CONFLICT (worker_id) DO UPDATE SET average_rating = EXCLUDED.average_rating, is_probation = EXCLUDED.is_probation;
    
    -- Clients
    INSERT INTO public.profiles (email, full_name, role, is_verified, is_available, is_active)
    VALUES 
        ('client1@test.com', 'David Anderson', 'client', true, true, true),
        ('client2@test.com', 'Jennifer Lee', 'client', true, true, true),
        ('client3@test.com', 'Robert Williams', 'client', true, true, true),
        ('client4@test.com', 'Maria Garcia', 'client', true, true, true),
        ('client5@test.com', 'Thomas Brown', 'client', true, true, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    
    -- Re-enable triggers
    ALTER TABLE public.profiles ENABLE TRIGGER ALL;
    
    RAISE NOTICE '✅ Mock profiles created! Now create auth users in Supabase Dashboard.';
END $$;

-- Verify
SELECT 
    email,
    full_name,
    role,
    is_verified,
    is_available
FROM public.profiles
WHERE email LIKE '%@test.com'
ORDER BY role, email;
