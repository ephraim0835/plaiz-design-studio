-- RESTORE SMART FEATURES (Scoring & Chat)
-- Now that the "Toggle" works, we bring back the advanced logic.

-- 1. RESTORE AUTO-CHAT TRIGGER
CREATE OR REPLACE FUNCTION public.trigger_init_project_chat()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'in_progress' and wasn't before
    IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') THEN
        
        -- Insert System Message (Welcome)
        INSERT INTO public.messages (project_id, sender_id, content)
        VALUES (
            NEW.id, 
            NEW.worker_id,
            'Hello! I have been assigned to your project. Please review the details and let me know if you have any questions.'
        );
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Verify this doesn't crash the transaction
    RAISE WARNING 'Auto-Chat failed for project %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_assigned_start_chat ON public.projects;
CREATE TRIGGER on_project_assigned_start_chat
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trigger_init_project_chat();


-- 2. RESTORE ADVANCED SCORING (in auto_assign_worker)
CREATE OR REPLACE FUNCTION public.auto_assign_worker(project_category TEXT)
RETURNS UUID AS $$
DECLARE
    selected_worker_id UUID;
    target_role TEXT;
BEGIN
    IF project_category = 'web_design' THEN
        target_role := 'web_designer';
    ELSE
        target_role := 'graphic_designer';
    END IF;

    WITH scored_candidates AS (
        SELECT 
            p.id,
            -- RESTORED: Use the calculate function
            public.calculate_worker_score(p.id, project_category) as score
        FROM public.profiles p
        LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE 
            p.role::TEXT = target_role
            AND p.is_verified = true
            AND p.is_available = true
            AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 3)
    ),
    top3 AS (
        SELECT id FROM scored_candidates ORDER BY score DESC, random() LIMIT 3
    )
    SELECT id INTO selected_worker_id FROM top3 ORDER BY random() LIMIT 1;

    RETURN selected_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
