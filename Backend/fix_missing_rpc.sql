-- FIX: CREATE MISSING WORKER STATS HELPER FUNCTIONS
-- Required by toggle_worker_availability and Admin dashboard

-- 1. INCREMENT ACTIVE PROJECTS
CREATE OR REPLACE FUNCTION public.increment_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = COALESCE(active_projects, 0) + 1,
        total_projects = COALESCE(total_projects, 0) + 1,
        updated_at = NOW()
    WHERE worker_id = worker_id_param;
    
    -- If no row exists (shouldn't happen for valid workers, but safe-guard)
    IF NOT FOUND THEN
        INSERT INTO public.worker_stats (worker_id, active_projects, total_projects)
        VALUES (worker_id_param, 1, 1);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DECREMENT ACTIVE PROJECTS
CREATE OR REPLACE FUNCTION public.decrement_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = GREATEST(COALESCE(active_projects, 0) - 1, 0),
        updated_at = NOW()
    WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
