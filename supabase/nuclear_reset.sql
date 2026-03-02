-- ====================================================================
-- NUCLEAR WIPE: TOTAL DATABASE RESET
-- WARNING: THIS DELETES EVERYTHING IN THE PUBLIC SCHEMA
-- ====================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop all Triggers
    FOR r IN (SELECT trigger_name, event_object_table 
              FROM information_schema.triggers 
              WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON public.' || r.event_object_table;
    END LOOP;

    -- 2. Drop all Functions (Handle Overloading)
    FOR r IN (SELECT 'public.' || quote_ident(p.proname) || '(' || pg_get_function_identity_arguments(p.oid) || ')' as func_identity
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_identity || ' CASCADE';
    END LOOP;

    -- 3. Drop all Tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- 4. Drop all Views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;

    -- 5. Drop all Enums
    FOR r IN (SELECT t.typname
              FROM pg_type t 
              JOIN pg_enum e ON t.oid = e.enumtypid  
              GROUP BY t.typname) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;

END $$;

-- Verify
SELECT 'REDEEMED' as status;
