-- UNIFY PAYOUT LOGIC
-- 1. Ensure the trigger uses the 'payouts' table instead of 'payout_logs'
-- 2. Update split to 40% Agency / 60% Worker

CREATE OR REPLACE FUNCTION handle_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_project_title TEXT;
    v_project_category TEXT;
    v_final_file TEXT;
    v_agreement RECORD;
    v_amount NUMERIC;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- STEP 1: Increment Worker Assignment Counter
        UPDATE worker_rotation 
        SET assignment_count = assignment_count + 1,
            last_assigned_at = NOW()
        WHERE worker_id = NEW.worker_id;

        -- STEP 2: Fetch Project Details
        SELECT title, category, final_file INTO v_project_title, v_project_category, v_final_file
        FROM projects WHERE id = NEW.id;

        -- STEP 3: Auto-Gallery Upload (only if service_type is set)
        IF v_project_category IS NOT NULL AND v_final_file IS NOT NULL THEN
            INSERT INTO portfolio (
                worker_id, 
                project_id, 
                image_url, 
                service_type, 
                description,
                is_featured,
                created_at
            ) VALUES (
                NEW.worker_id,
                NEW.id,
                v_final_file,
                v_project_category,
                v_project_title || ' - Project completed successfully.',
                false,
                NOW()
            ) ON CONFLICT (project_id) DO NOTHING;
        END IF;

        -- STEP 4: Create Payout Record (40/60 Split)
        -- Fetch agreement amount
        SELECT amount INTO v_agreement FROM agreements WHERE project_id = NEW.id ORDER BY created_at DESC LIMIT 1;
        
        v_amount := COALESCE(v_agreement.amount, NEW.assignment_metadata->>'budget_ngn', '0')::NUMERIC;

        -- Insert into payouts table (Matches UI implementation)
        INSERT INTO payouts (
            project_id,
            worker_id,
            amount,            -- This will hold the total or final amount
            platform_fee,      -- Storing the 40% cut here for records
            status,
            created_at
        ) VALUES (
            NEW.id,
            NEW.worker_id,
            v_amount,
            v_amount * 0.40,   -- 40% Platform Fee
            'awaiting_payment',
            NOW()
        ) ON CONFLICT (project_id) DO NOTHING;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS tr_on_project_complete ON projects;
CREATE TRIGGER tr_on_project_complete
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION handle_project_completion();
