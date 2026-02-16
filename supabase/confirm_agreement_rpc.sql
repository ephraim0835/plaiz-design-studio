DROP FUNCTION IF EXISTS public.confirm_agreement(UUID);

CREATE OR REPLACE FUNCTION public.confirm_agreement(
    p_agreement_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_project_id UUID;
BEGIN
    -- Update Agreement
    UPDATE public.agreements
    SET status = 'accepted'
    WHERE id = p_agreement_id
    RETURNING project_id INTO v_project_id;

    IF v_project_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agreement not found');
    END IF;

    -- Update Project Status
    UPDATE public.projects
    SET status = 'pending_down_payment'
    WHERE id = v_project_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
