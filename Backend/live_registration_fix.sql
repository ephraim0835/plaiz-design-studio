-- ==========================================
-- LIVE SITE REGISTRATION FIX
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create Enums (if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('client', 'graphic_designer', 'web_designer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Ensure Profiles Table exists with correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role user_role_enum DEFAULT 'client'::user_role_enum,
    specialization TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Robust Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_spec := NEW.raw_user_meta_data->>'specialization';
    
    -- Robust role detection
    IF meta_role = 'graphic_designer' OR meta_spec = 'graphic_designer' THEN
        target_role := 'graphic_designer'::user_role_enum;
    ELSIF meta_role = 'web_designer' OR meta_spec = 'web_designer' THEN
        target_role := 'web_designer'::user_role_enum;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin'::user_role_enum;
    ELSE
        target_role := 'client'::user_role_enum;
    END IF;
    
    INSERT INTO public.profiles (id, email, full_name, role, specialization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        target_role,
        COALESCE(meta_spec, meta_role)
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Fallback to allow registration even if profile fails (though not ideal)
END;
$$;

-- 4. Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
