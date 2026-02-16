-- FINAL FORCE REPAIR & MATCHING UPGRADE (V2)
-- This ensures 'pixelz' is perfectly aligned and satisfies ALL bank account constraints.

-- 1. FORCE ALIGN 'pixelz'
UPDATE public.profiles 
SET 
  role = 'graphic_designer',
  skill = 'graphics',
  is_active = true,
  is_available = true,
  minimum_price = 0,
  skills = ARRAY['graphics', 'logo_design', 'branding']
WHERE full_name ILIKE 'pixelz';

-- 2. ENSURE BANK & STATS EXIST (With ALL required NOT NULL fields)
INSERT INTO public.bank_accounts (worker_id, is_verified, bank_name, bank_code, account_number, account_name)
SELECT id, true, 'Plaiz Bank', '999', '0000000000', 'Pixelz' FROM public.profiles WHERE full_name ILIKE 'pixelz'
ON CONFLICT (worker_id) DO UPDATE SET 
  is_verified = true,
  bank_name = 'Plaiz Bank',
  bank_code = '999',
  account_number = '0000000000',
  account_name = 'Pixelz';

INSERT INTO public.worker_stats (worker_id, active_projects, max_projects_limit)
SELECT id, 0, 10 FROM public.profiles WHERE full_name ILIKE 'pixelz'
ON CONFLICT (worker_id) DO UPDATE SET active_projects = 0, max_projects_limit = 10;

-- 3. RESET ROTATION (Clear any old locks)
DELETE FROM public.worker_rotation;

-- 4. UPDATE MATCHING FUNCTION (V5.4 - RE-REFINED)
CREATE OR REPLACE FUNCTION match_worker_to_project(
    p_skill TEXT,
    p_budget NUMERIC,
    p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_normalized_skill TEXT;
    v_role_alias TEXT;
BEGIN
    -- Normalize skill names (Graphics, Web, Printing)
    v_normalized_skill := CASE 
        WHEN p_skill IN ('graphic_design', 'logo_design', 'graphics', 'graphic designer') THEN 'graphics'
        WHEN p_skill IN ('web_design', 'website', 'web', 'web designer') THEN 'web'
        WHEN p_skill IN ('printing', 'print', 'print specialist') THEN 'printing'
        ELSE p_skill
    END;

    -- Map to Profile Roles
    v_role_alias := CASE 
        WHEN v_normalized_skill = 'graphics' THEN 'graphic_designer'
        WHEN v_normalized_skill = 'web' THEN 'web_designer'
        WHEN v_normalized_skill = 'printing' THEN 'print_specialist'
        ELSE v_normalized_skill
    END;

    -- ATTEMPT MATCH
    SELECT p.id INTO v_worker_id
    FROM profiles p
    LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
    LEFT JOIN worker_stats ws ON ws.worker_id = p.id
    WHERE 
        -- Category Check
        (p.skill = v_normalized_skill OR p.role = v_role_alias OR v_normalized_skill = ANY(COALESCE(p.skills, '{}')))
        AND p.role NOT IN ('client', 'admin')
        
        -- Readiness Guards
        AND p.is_active = true
        AND COALESCE(p.is_available, true) = true
        AND COALESCE(ba.is_verified, false) = true
        AND (p_budget <= 0 OR p_budget IS NULL OR COALESCE(p.minimum_price, 0) <= p_budget)
        AND COALESCE(ws.active_projects, 0) < COALESCE(ws.max_projects_limit, 5)
    ORDER BY RANDOM() -- Pick any ready worker
    LIMIT 1;

    -- Return the result
    RETURN v_worker_id;
END;
$$;
