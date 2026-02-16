-- ASSIGN ALL QUEUED PROJECTS TO PIXELZ
-- Run this AFTER reloading the schema cache

-- Get Pixelz ID and assign all queued projects
DO $$
DECLARE
    v_pixelz_id UUID;
    v_project RECORD;
BEGIN
    -- Find Pixelz
    SELECT id INTO v_pixelz_id 
    FROM public.profiles 
    WHERE full_name ILIKE '%pixelz%' 
    LIMIT 1;
    
    IF v_pixelz_id IS NULL THEN
        RAISE EXCEPTION 'Pixelz not found!';
    END IF;
    
    RAISE NOTICE 'Found Pixelz: %', v_pixelz_id;
    
    -- Assign all queued projects
    FOR v_project IN 
        SELECT id, title FROM public.projects WHERE status = 'queued'
    LOOP
        RAISE NOTICE 'Assigning project: % (%)', v_project.title, v_project.id;
        
        UPDATE public.projects 
        SET worker_id = v_pixelz_id,
            status = 'assigned',
            assigned_at = NOW()
        WHERE id = v_project.id;
        
        -- Add system message
        INSERT INTO public.messages (project_id, sender_id, content, is_system_message)
        VALUES (v_project.id, v_pixelz_id, 'I have been assigned to your project. Ready to start!', true);
        
        RAISE NOTICE 'Successfully assigned: %', v_project.title;
    END LOOP;
    
    RAISE NOTICE 'All queued projects have been assigned to Pixelz!';
END $$;
