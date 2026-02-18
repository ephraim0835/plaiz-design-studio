-- Final Project Workflow Fix: Missing Columns
-- This script ensures all columns required for the Worker Submission -> Client Approval flow exist

-- 1. Add missing tracking columns to projects
DO $$ 
BEGIN
    -- completed_at: Track when project was approved
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completed_at') THEN
        ALTER TABLE public.projects ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- final_file: Store binary/link for final delivery
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'final_file') THEN
        ALTER TABLE public.projects ADD COLUMN final_file TEXT;
    END IF;

    -- total_price: Store final agreed amount (to handle 20/80 split even if agreement is deleted)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'total_price') THEN
        ALTER TABLE public.projects ADD COLUMN total_price NUMERIC;
    END IF;
    
    -- payout_split_done: Track if backend split logic has run
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'payout_split_done') THEN
        ALTER TABLE public.projects ADD COLUMN payout_split_done BOOLEAN DEFAULT false;
    END IF;

    -- category: Required for Phase 16 backend logic (portfolio auto-upload)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE public.projects ADD COLUMN category TEXT;
    END IF;

    -- 2. Populate missing categories based on worker skill (recovery logic)
    UPDATE public.projects p
    SET category = COALESCE(pr.skill, 'graphics')
    FROM public.profiles pr
    WHERE p.worker_id = pr.id AND p.category IS NULL;
END $$;

-- 3. Update the completion function to be more robust
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
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
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
            COALESCE(v_project_category, 'graphics'), -- FALLBACK to prevent NOT NULL error
            COALESCE(v_project_title, 'Project') || ' - Project completed successfully.',
            false,
            NOW()
        );

        -- STEP 4: Log Payout for Backend Processing (AntiGravity Locked Shares)
        SELECT * INTO v_worker_bank FROM bank_accounts WHERE worker_id = NEW.worker_id AND is_verified = true;

        IF v_worker_bank.id IS NOT NULL THEN
            -- Insert into legacy logs
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
                NEW.total_price,
                COALESCE(NEW.payout_platform_share, 0),
                COALESCE(NEW.payout_worker_share, 0),
                jsonb_build_object(
                    'bank_name', v_worker_bank.bank_name,
                    'account_number', v_worker_bank.account_number,
                    'account_name', v_worker_bank.account_name
                ),
                'ready_for_transfer'
            );

            -- Insert into main payouts table (used by Admin Dashboard)
            INSERT INTO public.payouts (
                project_id,
                worker_id,
                amount,
                platform_fee,
                status
            ) VALUES (
                NEW.id,
                NEW.worker_id,
                COALESCE(NEW.payout_worker_share, 0),
                COALESCE(NEW.payout_platform_share, 0),
                'awaiting_payment'
            );
        END IF;

        -- STEP 5: Dynamic Learning (AntiGravity)
        -- Add the completed project's skill to the worker's learned_skills
        IF v_project_category IS NOT NULL THEN
            UPDATE public.profiles
            SET learned_skills = COALESCE(learned_skills, '{}'::jsonb) || jsonb_build_object(v_project_category, true)
            WHERE id = NEW.worker_id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

