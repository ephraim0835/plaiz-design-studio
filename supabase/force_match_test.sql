-- FORCE MATCH TEST V2: Visible Results
-- Run this in Supabase SQL Editor, then look at the "Results" tab.

CREATE OR REPLACE FUNCTION test_match_pixelz()
RETURNS TABLE (
    check_name TEXT,
    is_passed BOOLEAN,
    details TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_name TEXT := 'pixelz';
    v_skill_sought TEXT := 'graphics';
    v_budget_given NUMERIC := 1000;
    
    v_p_id UUID;
    v_p_role TEXT;
    v_p_skill TEXT;
    v_p_active BOOLEAN;
    v_p_available BOOLEAN;
    v_p_bank_verified BOOLEAN;
    v_p_min_price NUMERIC;
    v_p_active_projects INTEGER;
    v_p_limit INTEGER;
BEGIN
    -- 1. Fetch worker data
    SELECT 
        p.id, p.role, p.skill, p.is_active, COALESCE(p.is_available, true), 
        COALESCE(ba.is_verified, false), COALESCE(p.minimum_price, 0),
        COALESCE(ws.active_projects, 0), COALESCE(ws.max_projects_limit, 5)
    INTO 
        v_p_id, v_p_role, v_p_skill, v_p_active, v_p_available, 
        v_p_bank_verified, v_p_min_price, v_p_active_projects, v_p_limit
    FROM profiles p
    LEFT JOIN bank_accounts ba ON ba.worker_id = p.id
    LEFT JOIN worker_stats ws ON ws.worker_id = p.id
    WHERE p.full_name ILIKE v_target_name;

    IF v_p_id IS NULL THEN
        check_name := 'Worker Selection';
        is_passed := false;
        details := 'Worker "pixelz" not found in profiles table!';
        RETURN NEXT;
        RETURN;
    END IF;

    -- 2. Check Skill
    check_name := '1. Skill/Role Match';
    is_passed := (v_p_role = 'graphic_designer' OR v_p_skill = 'graphics');
    details := 'Worker has Skill: ' || COALESCE(v_p_skill, 'NULL') || ', Role: ' || v_p_role;
    RETURN NEXT;

    -- 3. Check Availability
    check_name := '2. Availability';
    is_passed := (v_p_active AND v_p_available);
    details := 'Active: ' || v_p_active::text || ', Available: ' || v_p_available::text;
    RETURN NEXT;

    -- 4. Check Bank
    check_name := '3. Bank Verification';
    is_passed := v_p_bank_verified;
    details := 'Is verified: ' || v_p_bank_verified::text;
    RETURN NEXT;

    -- 5. Check Budget
    check_name := '4. Budget Capacity';
    is_passed := (v_p_min_price <= v_budget_given);
    details := 'Worker Min: ' || v_p_min_price::text || ', Project Budget: ' || v_budget_given::text;
    RETURN NEXT;

    -- 6. Check Project Capacity
    check_name := '5. Workload Limit';
    is_passed := (v_p_active_projects < v_p_limit);
    details := 'Current Projects: ' || v_p_active_projects::text || ', Limit: ' || v_p_limit::text;
    RETURN NEXT;

    -- 7. Final Test Logic Check
    check_name := 'FINAL RESULT';
    is_passed := (
        (v_p_role = 'graphic_designer' OR v_p_skill = 'graphics')
        AND v_p_active 
        AND v_p_available
        AND v_p_bank_verified
        AND (v_p_min_price <= v_budget_given)
        AND (v_p_active_projects < v_p_limit)
    );
    IF is_passed THEN
        details := '🎉 EVERYTHING PASSES. Pixelz should be matching perfectly!';
    ELSE
        details := '❌ FAILED. One or more conditions above are blocking the match.';
    END IF;
    RETURN NEXT;
END;
$$;

-- RUN THE TEST
SELECT * FROM test_match_pixelz();
