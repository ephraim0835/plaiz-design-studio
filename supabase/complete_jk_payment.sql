-- TEMPORARILY DISABLE PORTFOLIO TRIGGER TO COMPLETE PAYMENT FOR PROJECT JK

-- Disable the trigger
ALTER TABLE projects DISABLE TRIGGER tr_on_project_complete;

-- Process the payment
DO $$
DECLARE
    v_project_id UUID;
    v_client_id UUID;
    v_amount NUMERIC := 60;
BEGIN
    SELECT id, client_id INTO v_project_id, v_client_id
    FROM public.projects
    WHERE title = 'jk'
    LIMIT 1;
    
    -- Update project to completed
    UPDATE public.projects
    SET status = 'completed',
        total_paid = 100,
        final_payment_id = uuid_generate_v4()
    WHERE id = v_project_id;
    
    -- Log payment
    INSERT INTO public.payments (project_id, client_id, amount, reference, status, type, phase)
    VALUES (v_project_id, v_client_id, v_amount, 'manual_recovery_' || NOW()::TEXT, 'completed', 'project_milestone', 'balance_60');
    
    -- Send system message
    INSERT INTO public.messages (project_id, sender_id, content, is_system_message)
    VALUES (v_project_id, v_client_id, 'Final payment (60%) received. Project completed! Your high-quality files are now unlocked.', true);
    
    RAISE NOTICE 'Payment processed successfully!';
END $$;

-- Re-enable the trigger
ALTER TABLE projects ENABLE TRIGGER tr_on_project_complete;
