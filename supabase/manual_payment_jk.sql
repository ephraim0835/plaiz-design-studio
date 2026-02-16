-- MANUALLY PROCESS PAYMENT FOR PROJECT "jk" (60% balance)
-- This bypasses the normal workflow to complete the payment

DO $$
DECLARE
    v_project_id UUID;
    v_client_id UUID;
    v_amount NUMERIC := 60000; -- Replace with actual amount
BEGIN
    -- Get project details
    SELECT id, client_id INTO v_project_id, v_client_id
    FROM public.projects
    WHERE title = 'jk'
    LIMIT 1;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Project "jk" not found!';
    END IF;
    
    RAISE NOTICE 'Processing payment for project: %', v_project_id;
    RAISE NOTICE 'Client ID: %', v_client_id;
    
    -- Update project status to completed
    UPDATE public.projects
    SET status = 'completed',
        total_paid = COALESCE(total_paid, 0) + v_amount,
        final_payment_id = uuid_generate_v4()
    WHERE id = v_project_id;
    
    -- Log payment
    INSERT INTO public.payments (project_id, client_id, amount, reference, status, type, phase)
    VALUES (v_project_id, v_client_id, v_amount, 'manual_' || NOW()::TEXT, 'completed', 'project_milestone', 'balance_60');
    
    -- Send system message
    INSERT INTO public.messages (project_id, sender_id, content, is_system_message)
    VALUES (
        v_project_id,
        v_client_id,
        'Final payment (60%) received. Project completed! Your high-quality files are now unlocked.',
        true
    );
    
    RAISE NOTICE 'Payment processed successfully!';
END $$;
