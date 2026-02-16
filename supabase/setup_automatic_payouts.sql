-- AUTOMATIC PAYOUT SYSTEM SETUP
-- This creates the infrastructure for automatic worker payouts

-- 1. First, run the fixed trigger
CREATE OR REPLACE FUNCTION handle_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_worker_bank RECORD;
    v_project_title TEXT;
    v_project_category TEXT;
    v_final_file TEXT;
    v_agreement RECORD;
    v_payout_amount NUMERIC;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        UPDATE worker_rotation 
        SET assignment_count = assignment_count + 1, last_assigned_at = NOW()
        WHERE worker_id = NEW.worker_id;

        SELECT title, category, final_file INTO v_project_title, v_project_category, v_final_file
        FROM projects WHERE id = NEW.id;

        -- Auto-Gallery Upload (only if service_type exists)
        IF v_project_category IS NOT NULL AND v_final_file IS NOT NULL THEN
            INSERT INTO portfolio (worker_id, project_id, image_url, service_type, description, is_featured, created_at)
            VALUES (NEW.worker_id, NEW.id, v_final_file, v_project_category, v_project_title || ' - Project completed successfully.', false, NOW());
        END IF;

        -- Calculate payout
        SELECT amount INTO v_agreement FROM agreements WHERE project_id = NEW.id ORDER BY created_at DESC LIMIT 1;
        SELECT * INTO v_worker_bank FROM bank_accounts WHERE worker_id = NEW.worker_id AND is_verified = true;
        
        v_payout_amount := COALESCE(v_agreement.amount, NEW.total_price, 0);

        -- Create payout entry
        INSERT INTO payout_logs (
            project_id, worker_id, total_amount, business_cut, worker_cut, worker_bank_info,
            status
        ) VALUES (
            NEW.id, NEW.worker_id, v_payout_amount, v_payout_amount * 0.20, v_payout_amount * 0.80,
            CASE WHEN v_worker_bank.id IS NOT NULL THEN
                jsonb_build_object('bank_name', v_worker_bank.bank_name, 'account_number', v_worker_bank.account_number, 'account_name', v_worker_bank.account_name)
            ELSE NULL END,
            CASE WHEN v_worker_bank.id IS NOT NULL THEN 'ready_for_transfer' ELSE 'pending_bank_info' END
        );

        -- TODO: Trigger Edge Function to process payout via Paystack/Flutterwave
        -- This would call an Edge Function that initiates the bank transfer

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_project_complete ON projects;
CREATE TRIGGER tr_on_project_complete
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION handle_project_completion();
