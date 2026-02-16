-- FINAL STATUS & RECOVERY REPAIR (V14.0)
-- This script fixes the "projects_status_check" violation AND handles message attribution correctly.

-- 1. FIX THE CONSTRAINT (Unlocks 'assigned' and 'queued' states)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'pending', 
    'assigned', 
    'queued', 
    'chat_negotiation', 
    'pending_agreement', 
    'pending_down_payment', 
    'active', 
    'in_progress', 
    'ready_for_review', 
    'review', 
    'approved', 
    'awaiting_payout', 
    'awaiting_final_payment', 
    'completed', 
    'cancelled', 
    'flagged'
));

-- 2. RUN RECOVERY
DO $$ 
DECLARE 
    v_pixelz_id UUID;
    v_project RECORD;
BEGIN
    -- Find Pixelz
    SELECT id INTO v_pixelz_id FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    
    IF v_pixelz_id IS NULL THEN
        RAISE NOTICE 'CRITICAL: Pixelz not found. Cannot recover projects.';
        RETURN;
    END IF;

    -- Find all projects that need assignment
    FOR v_project IN (SELECT id, title FROM public.projects WHERE status = 'queued' OR worker_id IS NULL) LOOP
        -- Assign to Pixelz
        UPDATE public.projects 
        SET 
            worker_id = v_pixelz_id, 
            status = 'assigned'
        WHERE id = v_project.id;

        RAISE NOTICE 'Project Recovered: %', v_project.title;
        
        -- Create a system message. (Using project_id as it is the standard for this app)
        INSERT INTO public.messages (project_id, sender_id, content)
        VALUES (v_project.id, v_pixelz_id, 'Project assigned to Pixelz via recovery protocol.');

    END LOOP;

    RAISE NOTICE 'V14.0 Recovery complete.';
END $$;
