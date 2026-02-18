-- ROBUST REGISTRATION TRIGGER (V4)
-- Handles legacy IDs (web_design vs web_designer) and adds missing roles

-- 1. Ensure enum is up to date
DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE 'print_specialist';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Update trigger to be ultra-robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
BEGIN
    meta_role := lower(NEW.raw_user_meta_data->>'role');
    meta_spec := lower(NEW.raw_user_meta_data->>'specialization');

    -- LOGGING for debug
    RAISE LOG 'Registration: meta_role=%, meta_spec=%', meta_role, meta_spec;

    -- ROBUST LOGIC: Check both role and spec fields for keyword matches
    IF meta_role = 'worker' OR meta_spec IS NOT NULL OR meta_role IN ('web_design', 'web_designer', 'graphic_design', 'graphic_designer', 'print_specialist', 'printing') THEN
        IF meta_spec LIKE '%web%' OR meta_role LIKE '%web%' THEN
            target_role := 'web_designer';
        ELSIF meta_spec LIKE '%print%' OR meta_role LIKE '%print%' OR meta_spec LIKE '%printing%' OR meta_role LIKE '%printing%' THEN
            target_role := 'print_specialist';
        ELSE
            target_role := 'graphic_designer';
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    INSERT INTO public.profiles (
        id, 
        full_name, 
        avatar_url, 
        role, 
        specialization,
        is_available,
        is_verified
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
        NEW.raw_user_meta_data->>'avatar_url', 
        target_role,
        meta_spec,
        false,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        specialization = EXCLUDED.specialization;

    -- Ensure worker_stats entry
    IF target_role IN ('graphic_designer', 'web_designer', 'print_specialist') THEN
        INSERT INTO public.worker_stats (worker_id)
        VALUES (NEW.id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Manual Correction for "possible web" (stickanimation007@gmail.com)
UPDATE public.profiles 
SET role = 'web_designer', specialization = 'web_designer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'stickanimation007@gmail.com');

-- Ensure stats entry for existing user
INSERT INTO public.worker_stats (worker_id)
SELECT id FROM auth.users WHERE email = 'stickanimation007@gmail.com'
ON CONFLICT DO NOTHING;
