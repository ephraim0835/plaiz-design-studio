-- STANDARDIZE DEBUG TABLE
-- Ensures the debug table matches the V12.0 function.

DROP TABLE IF EXISTS public.debug_matching_logs;

CREATE TABLE public.debug_matching_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    criteria TEXT,
    status TEXT,
    match_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions again just in case
GRANT ALL ON TABLE public.debug_matching_logs TO authenticated, anon, service_role;
