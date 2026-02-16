-- PROMOTE EXISTING USER TO DESIGNER
-- Replace the email below with the email of your graphic designer account.

DO $$
DECLARE
    -- 👇👇👇 ENTER THE DESIGNER'S EMAIL HERE 👇👇👇
    target_email TEXT := 'ENTER_DESIGNER_EMAIL_HERE'; 
    -- 👆👆👆 -------------------------------- 👆👆👆
    
    target_id UUID;
BEGIN
    -- 1. Find the User ID
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;

    IF target_id IS NULL THEN
        RAISE NOTICE '❌ User with email % not found! Please check the spelling.', target_email;
        RETURN;
    END IF;

    -- 2. Update Profile to Valid Designer
    UPDATE public.profiles
    SET 
        role = 'designer',
        specialization = 'graphic_designer',
        is_available = true,
        is_verified = true
    WHERE id = target_id;
    
    -- 3. Ensure Worker Stats (Capacity)
    INSERT INTO public.worker_stats (worker_id, active_projects, max_projects_limit, is_probation, average_rating)
    VALUES (target_id, 0, 10, false, 5.0)
    ON CONFLICT (worker_id) DO UPDATE 
    SET 
        active_projects = 0, 
        max_projects_limit = 10, 
        is_probation = false;
    
    RAISE NOTICE '✅ Success! User % is now a generic DESIGNER and should appear as available.', target_email;
END $$;
