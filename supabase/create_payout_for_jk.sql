-- CREATE PAYOUT ENTRY FOR PROJECT JK WORKER
-- This creates a payout log entry for Pixelz to receive their 80% split

DO $$
DECLARE
    v_project_id UUID;
    v_worker_id UUID;
    v_total_amount NUMERIC;
    v_worker_bank RECORD;
BEGIN
    -- Get project details
    SELECT id, worker_id, total_price INTO v_project_id, v_worker_id, v_total_amount
    FROM public.projects
    WHERE title = 'jk'
    LIMIT 1;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Project "jk" not found!';
    END IF;
    
    RAISE NOTICE 'Project ID: %', v_project_id;
    RAISE NOTICE 'Worker ID: %', v_worker_id;
    RAISE NOTICE 'Total Amount: %', v_total_amount;
    
    -- Get worker's verified bank account
    SELECT * INTO v_worker_bank 
    FROM public.bank_accounts 
    WHERE worker_id = v_worker_id AND is_verified = true
    LIMIT 1;
    
    IF v_worker_bank.id IS NULL THEN
        RAISE NOTICE 'No verified bank account found for worker. Creating payout entry without bank info.';
    END IF;
    
    -- Create payout log entry (20% platform, 80% worker)
    INSERT INTO public.payout_logs (
        project_id,
        worker_id,
        total_amount,
        business_cut,
        worker_cut,
        worker_bank_info,
        status
    ) VALUES (
        v_project_id,
        v_worker_id,
        v_total_amount,
        v_total_amount * 0.20,  -- 20% to platform
        v_total_amount * 0.80,  -- 80% to worker
        CASE 
            WHEN v_worker_bank.id IS NOT NULL THEN
                jsonb_build_object(
                    'bank_name', v_worker_bank.bank_name,
                    'account_number', v_worker_bank.account_number,
                    'account_name', v_worker_bank.account_name
                )
            ELSE NULL
        END,
        'ready_for_transfer'
    );
    
    RAISE NOTICE 'Payout entry created successfully!';
    RAISE NOTICE 'Platform cut (20%%): %', v_total_amount * 0.20;
    RAISE NOTICE 'Worker cut (80%%): %', v_total_amount * 0.80;
END $$;
