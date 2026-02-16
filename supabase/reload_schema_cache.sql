-- RELOAD POSTGREST SCHEMA CACHE
-- This command forces PostgREST to reload its schema cache
-- Run this in the Supabase SQL Editor to resolve schema cache issues

NOTIFY pgrst, 'reload schema';

-- After running this, wait 5-10 seconds for the cache to reload
-- Then you can assign queued projects to Pixelz using the assignment scripts
