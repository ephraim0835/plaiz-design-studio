-- RECOVERY SCRIPT: FIX STUCK PROJECTS (v2)
-- Removed "updated_at" which does not exist in the projects table.

DO $$ 
DECLARE 
    v_pixelz_id UUID;
    v_project RECORD;
BEGIN
    -- 1. Find Pixelz
    SELECT id INTO v_pixelz_id FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    
    IF v_pixelz_id IS NULL THEN
        RAISE NOTICE 'CRITICAL: Pixelz not found. Cannot recover projects.';
        RETURN;
    END IF;

    -- 2. Find all stuck projects
    FOR v_project IN (SELECT id, title FROM public.projects WHERE status = 'queued' OR worker_id IS NULL) LOOP
        -- Assign to Pixelz
        UPDATE public.projects 
        SET 
            worker_id = v_pixelz_id, 
            status = 'assigned'
        WHERE id = v_project.id;

        RAISE NOTICE 'Recovered Project: %', v_project.title;
        
        -- Create a system message if conversation exists
        INSERT INTO public.messages (conversation_id, sender_id, content, type)
        SELECT conversation_id, 'system', 'Worker assigned via recovery protocol.', 'system'
        FROM public.projects 
        WHERE id = v_project.id AND conversation_id IS NOT NULL;
    END LOOP;

    RAISE NOTICE 'Recovery complete.';
END $$;
