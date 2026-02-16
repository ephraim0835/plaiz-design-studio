-- DEEP STATE DIAGNOSTIC
-- This script checks EVERY reason why Pixelz might be skipped.

DO $$
DECLARE
    v_pixelz_id UUID;
    v_pixelz RECORD;
    v_bank RECORD;
    v_stats RECORD;
BEGIN
    SELECT * INTO v_pixelz FROM public.profiles WHERE full_name ILIKE '%pixelz%' LIMIT 1;
    v_pixelz_id := v_pixelz.id;

    IF v_pixelz_id IS NULL THEN
        RAISE NOTICE 'FAIL: Pixelz profile not found.';
    ELSE
        RAISE NOTICE 'Pixelz ID: %', v_pixelz_id;
        RAISE NOTICE 'Role: %, Skill: %, Active: %, Available: %', v_pixelz.role, v_pixelz.skill, v_pixelz.is_active, v_pixelz.is_available;
        
        SELECT * INTO v_bank FROM public.bank_accounts WHERE worker_id = v_pixelz_id;
        IF v_bank.is_verified THEN
            RAISE NOTICE 'Bank: VERIFIED';
        ELSE
            RAISE NOTICE 'Bank: NOT VERIFIED (or bank_accounts record missing)';
        END IF;

        SELECT * INTO v_stats FROM public.worker_stats WHERE worker_id = v_pixelz_id;
        IF v_stats.id IS NOT NULL THEN
            RAISE NOTICE 'Stats: Active Projects: %, Probation: %', v_stats.active_projects, v_stats.is_probation;
        ELSE
            RAISE NOTICE 'Stats: MISSING worker_stats record';
        END IF;
    END IF;
END $$;
