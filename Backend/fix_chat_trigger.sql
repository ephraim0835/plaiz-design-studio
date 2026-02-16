-- TRIGGER: AUTO-CREATE CHAT ON ASSIGNMENT
-- When a project status changes to 'in_progress', insert a system message to start the chat.

CREATE OR REPLACE FUNCTION public.trigger_init_project_chat()
RETURNS TRIGGER AS $$
DECLARE
    worker_name TEXT;
BEGIN
    -- Check if status changed to 'in_progress' (Worker Assigned)
    IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') THEN
        
        -- Get worker name
        SELECT full_name INTO worker_name FROM public.profiles WHERE id = NEW.worker_id;
        
        -- Insert System Message
        INSERT INTO public.messages (project_id, sender_id, content, is_system_message)
        VALUES (
            NEW.id, 
            NEW.worker_id, -- Attributed to worker, or maybe a system user? Let's use worker for now or create a 'system' flag.
            -- Actually, let's assume specific "System" ID doesn't exist, so we attribute to worker or leave sender_id null if allowed.
            -- But setup_system.sql likely requires sender_id.
            -- Let's attribute to the Worker to be safe:
            'Hello! I have been assigned to your project. Please review the details and let me know if you have any questions.',
            true -- Assuming we add this column or it exists? Check setup_system.sql first.
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BUT WAIT: We need to check if 'is_system_message' column exists in messages.
-- If not, we should add it or just send a normal message.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_system_message') THEN
        ALTER TABLE public.messages ADD COLUMN is_system_message BOOLEAN DEFAULT false;
    END IF;
END $$;

DROP TRIGGER IF EXISTS on_project_assigned_start_chat ON public.projects;
CREATE TRIGGER on_project_assigned_start_chat
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trigger_init_project_chat();
