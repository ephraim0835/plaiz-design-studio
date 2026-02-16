-- AI-Assisted Worker Auto-Assignment System Migration

-- 1. PROFILES UPDATE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
-- is_verified is already added in schema_upgrade_v4.sql

-- 2. WORKER STATS UPDATE
-- worker_stats table already exists from schema_upgrade_v3.sql
-- Ensure it has the necessary columns for the AI engine
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.worker_stats ADD COLUMN IF NOT EXISTS portfolio_summary TEXT;

-- 3. PROJECTS UPDATE
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}'::jsonb;

-- 4. SYSTEM SETTINGS
-- auto_assignment_enabled is already in system_settings from schema_upgrade_v5.sql

-- 5. REFINING WORKER_STATS INDEXES
CREATE INDEX IF NOT EXISTS idx_worker_stats_active_projects ON public.worker_stats(active_projects);
CREATE INDEX IF NOT EXISTS idx_worker_stats_is_probation ON public.worker_stats(is_probation);

-- 6. ADDING A SIMPLE LOGGING TABLE FOR ASSIGNMENT ATTEMPTS (Optional but good for fallback)
CREATE TABLE IF NOT EXISTS public.assignment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. CLEANUP OLD TRIGGER (We are moving to Edge Functions)
-- However, we might want to keep the old trigger as a fallback or simply disable it.
-- For now, let's keep it but skip it if a new column 'assignment_logic' is set to 'ai'.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assignment_method TEXT DEFAULT 'rules'; -- 'rules' or 'ai'

-- Update the existing trigger function to check for 'ai' method
CREATE OR REPLACE FUNCTION public.trigger_auto_assign_on_new_project()
RETURNS TRIGGER AS $$
DECLARE
    found_worker_id UUID;
    ai_enabled BOOLEAN;
BEGIN
    -- Check if auto-assignment is enabled in system settings
    SELECT (value->>0)::BOOLEAN INTO ai_enabled 
    FROM public.system_settings 
    WHERE key = 'auto_assignment_enabled';

    IF ai_enabled = false THEN
        RETURN NEW;
    END IF;

    -- If method is 'ai', we skip the SQL-based auto-assign and wait for the Edge Function
    IF NEW.assignment_method = 'ai' THEN
        RETURN NEW;
    END IF;

    -- Fallback to old rules-based assignment if no worker assigned yet
    IF NEW.status = 'pending' AND NEW.worker_id IS NULL THEN
        found_worker_id := public.auto_assign_worker(NEW.project_type::TEXT);
        
        IF found_worker_id IS NOT NULL THEN
            NEW.worker_id := found_worker_id;
            NEW.status := 'in_progress';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to increment worker active projects count
CREATE OR REPLACE FUNCTION increment_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = active_projects + 1
    WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to decrement worker active projects count
CREATE OR REPLACE FUNCTION decrement_worker_active_projects(worker_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.worker_stats
    SET active_projects = GREATEST(0, active_projects - 1)
    WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
