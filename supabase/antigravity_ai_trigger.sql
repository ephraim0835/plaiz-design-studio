-- AntiGravity - AI Orchestrator Activation Trigger
-- This script creates a trigger that calls the Supabase Edge Function whenever a new project is created.
-- Ensure you have deployed the function with: supabase functions deploy antigravity-orchestrator

-- 1. Enable pg_net extension if not already enabled (Supabase uses this for webhooks)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Trigger Function to invoke the orchestrator
CREATE OR REPLACE FUNCTION public.trigger_ai_orchestration()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform an asynchronous HTTP POST to the Edge Function
  -- Safer extraction of host and role using JSONB and COALESCE
  PERFORM
    net.http_post(
      url := 'https://' || COALESCE(current_setting('request.headers', true)::jsonb->>'host', 'fxdzfxvoowioiisnuwbn.supabase.co') || '/functions/v1/antigravity-orchestrator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'role', 'service_role')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. The Trigger
DROP TRIGGER IF EXISTS on_project_created_orchestrate ON public.projects;
CREATE TRIGGER on_project_created_orchestrate
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_orchestration();
