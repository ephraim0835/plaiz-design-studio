-- TEST PROJECT CREATION & ASSIGNMENT TRIGGER
-- This script manually inserts a project to see if the auto-assignment trigger works.

DO $$
DECLARE
    new_project_id UUID;
    final_status TEXT;
    assigned_worker UUID;
    client_id UUID;
BEGIN
    -- 1. Get a valid client ID (your user)
    SELECT id INTO client_id FROM auth.users WHERE email = 'platinumfx24@gmail.com';
    
    IF client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found!';
    END IF;

    -- 2. Insert a test project
    INSERT INTO public.projects (
        title, 
        description, 
        service_type, 
        status, 
        client_id, 
        budget_range, 
        deadline_info
    )
    VALUES (
        'Test Project ' || gen_random_uuid(), 
        'Testing auto-assignment trigger logic', 
        'graphic_design', 
        'pending', 
        client_id, 
        '$1,000 - $5,000', 
        '2-4 Weeks'
    )
    RETURNING id INTO new_project_id;

    -- 3. Check the status immediately after insertion
    -- (The trigger should have fired synchronously)
    SELECT status, worker_id INTO final_status, assigned_worker 
    FROM public.projects 
    WHERE id = new_project_id;

    RAISE NOTICE 'Project Created ID: %', new_project_id;
    RAISE NOTICE 'Final Status: % (Expected: in_progress)', final_status;
    RAISE NOTICE 'Assigned Worker: %', assigned_worker;

    IF final_status = 'in_progress' THEN
        RAISE NOTICE '✅ SUCCESS: Trigger worked and worker was assigned.';
    ELSIF final_status = 'queued' THEN
        RAISE NOTICE '⚠️ QUEUED: Trigger worked but no worker was available (Check available designers).';
    ELSE
        RAISE NOTICE '❌ FAILED: Status remains "pending". The trigger did not fire or failed silently.';
    END IF;

END $$;
