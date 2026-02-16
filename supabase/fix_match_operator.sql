-- FIX MATCH OPERATOR
-- The previous function used a JSON operator (?) on a Text Array column.
-- This script fixes it to use the correct Postgres Array operator (= ANY).

CREATE OR REPLACE FUNCTION public.find_best_worker(
    p_service_type TEXT,
    p_required_role TEXT
) RETURNS UUID AS $$
DECLARE
    v_worker_id UUID;
    v_best_score INTEGER := -1;
    v_current_score JSONB;
    v_candidate RECORD;
    v_score_val INTEGER;
BEGIN
    -- Iterate over workers with correct role
    FOR v_candidate IN 
        SELECT p.id, p.full_name 
        FROM public.profiles p
        JOIN public.worker_stats ws ON p.id = ws.worker_id
        WHERE p.role = p_required_role
        OR (p.role = 'worker' AND p_service_type = ANY(ws.skills)) -- FIXED HERE
    LOOP
        -- Calculate Score
        v_current_score := calculate_match_score(v_candidate.id, p_service_type, p_required_role);
        v_score_val := (v_current_score->>'total')::INTEGER;

        -- Update Best
        IF v_score_val > v_best_score THEN
            v_best_score := v_score_val;
            v_worker_id := v_candidate.id;
        END IF;
    END LOOP;

    RETURN v_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions just in case
GRANT EXECUTE ON FUNCTION public.find_best_worker(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_best_worker(TEXT, TEXT) TO service_role;
