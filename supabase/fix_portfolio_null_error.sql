-- Database Patch: Fix Portfolio Auto-Upload Null Error
-- Adds a safety check to prevent trigger failure if final_file is missing.

CREATE OR REPLACE FUNCTION handle_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_worker_bank RECORD;
    v_project_title TEXT;
    v_project_category TEXT;
    v_final_file TEXT;
    v_agreement RECORD;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- STEP 1: Increment Worker Assignment Counter
        UPDATE worker_rotation 
        SET assignment_count = assignment_count + 1,
            last_assigned_at = NOW()
        WHERE worker_id = NEW.worker_id;

        -- STEP 2: Fetch Final Details
        SELECT title, category, final_file INTO v_project_title, v_project_category, v_final_file
        FROM projects WHERE id = NEW.id;

        -- STEP 3: Auto-Gallery Upload (with Safety Check)
        -- Only insert if we actually have an image to show
        IF v_final_file IS NOT NULL THEN
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
                COALESCE(v_project_title, 'Completed Project') || ' - Project completed successfully.',
                false,
                NOW()
            );
        END IF;

        -- STEP 4: Log Payout for Backend Processing (20/80 Split)
        SELECT amount INTO v_agreement FROM agreements WHERE project_id = NEW.id ORDER BY created_at DESC LIMIT 1;
        SELECT * INTO v_worker_bank FROM bank_accounts WHERE worker_id = NEW.worker_id AND is_verified = true;

        IF v_worker_bank.id IS NOT NULL THEN
            INSERT INTO payout_logs (
                project_id,
                worker_id,
                total_amount,
                business_cut,
                worker_cut,
                worker_bank_info,
                status
            ) VALUES (
                NEW.id,
                NEW.worker_id,
                COALESCE(v_agreement.amount, 0),
                COALESCE(v_agreement.amount, 0) * 0.20,
                COALESCE(v_agreement.amount, 0) * 0.80,
                jsonb_build_object(
                    'bank_name', v_worker_bank.bank_name,
                    'account_number', v_worker_bank.account_number,
                    'account_name', v_worker_bank.account_name
                ),
                'ready_for_transfer'
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
