-- CREATE DUMMY DESIGNER FOR TESTING
-- This script creates a fake designer profile so you can see "Designer Online" in the UI.
-- It uses a random ID so it won't conflict with your real account.

DO $$
DECLARE
    fake_id UUID := gen_random_uuid();
BEGIN
    -- 1. Insert Fake Profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        is_available, 
        is_verified, 
        specialization
    )
    VALUES (
        fake_id, 
        'dummy_designer_' || substr(fake_id::text, 1, 8) || '@test.com', 
        'Elite Dummy Designer', 
        'designer', 
        true, 
        true, 
        'graphic_designer'  -- Valid specialization
    );

    -- 2. Insert Worker Stats
    INSERT INTO public.worker_stats (
        worker_id, 
        active_projects, 
        max_projects_limit, 
        is_probation, 
        average_rating, 
        completed_projects
    )
    VALUES (
        fake_id, 
        0, 
        10, 
        false, 
        5.0, 
        100
    );

    RAISE NOTICE 'Created dummy designer with ID: %', fake_id;
END $$;
