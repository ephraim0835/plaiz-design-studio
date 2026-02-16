-- DIAGNOSTIC AND FIX SCRIPT FOR AVAILABLE DESIGNER
-- This script ensures there is at least one fully qualified 'designer' ready to accept projects.

DO $$
DECLARE
    target_email TEXT := 'platinumfx24@gmail.com'; 
    target_worker_id UUID;
BEGIN
    -- 1. Get the most recent user
    SELECT id INTO target_worker_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF target_worker_id IS NOT NULL THEN
        -- Update Profile
        INSERT INTO public.profiles (id, email, full_name, role, is_available, is_verified, specialization)
        VALUES (target_worker_id, 'test_worker@example.com', 'Test Designer', 'designer', true, true, 'graphic_designer')
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'designer',           
            is_available = true,         
            is_verified = true,          
            specialization = 'graphic_designer';
            
        -- Update Worker Stats
        INSERT INTO public.worker_stats (worker_id, active_projects, max_projects_limit, is_probation, average_rating)
        VALUES (target_worker_id, 0, 5, false, 5.0)
        ON CONFLICT (worker_id) DO UPDATE
        SET 
            active_projects = 0,         
            max_projects_limit = 5,
            is_probation = false;        
            
        RAISE NOTICE 'Worker % has been updated to VALID DESIGNER status.', target_worker_id;
    END IF;
END $$;

SELECT 
    p.email, 
    p.role, 
    p.is_available, 
    p.is_verified, 
    ws.active_projects, 
    ws.max_projects_limit, 
    ws.is_probation
FROM public.profiles p
LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.role = 'designer';
