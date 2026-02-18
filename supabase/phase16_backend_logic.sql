-- Phase 16: Automated Split & Gallery Logic
-- This script adds the logic to handle payment success and project completion

-- 1. Payout Split Records Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.payout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    worker_id UUID REFERENCES profiles(id),
    total_amount NUMERIC,
    business_cut NUMERIC,
    worker_cut NUMERIC,
    worker_bank_info JSONB,
    status TEXT DEFAULT 'pending_processing',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Function to trigger payout and gallery upload on project completion
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

        -- STEP 3: Auto-Gallery Upload
        -- Link to source project and store details
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
        );

        -- STEP 4: Log Payout for Backend Processing (Using Locked Shares)
        -- Fetch worker bank info
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
                COALESCE(NEW.total_price, 0),
                COALESCE(NEW.payout_platform_share, 0),
                COALESCE(NEW.payout_worker_share, 0),
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

-- 3. Trigger Attachment
DROP TRIGGER IF EXISTS tr_on_project_complete ON projects;
CREATE TRIGGER tr_on_project_complete
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION handle_project_completion();

-- 4. Payment Success Hook (Called by Edge Function or Frontend)
-- This marks the project as in_progress and confirms payment
CREATE OR REPLACE FUNCTION confirm_project_payment(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects 
    SET status = 'in_progress',
        payout_split_done = false
    WHERE id = p_project_id;
    
    INSERT INTO notifications (user_id, title, message, type, project_id)
    SELECT worker_id, 'Payment Received!', 'Client has paid. You can now start delivering the project.', 'payment_confirmed', id
    FROM projects WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
