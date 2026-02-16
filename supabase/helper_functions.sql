-- Helper function to get skill from service type
CREATE OR REPLACE FUNCTION get_skill_from_service(service_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE 
        WHEN service_type IN ('graphic_design', 'logo_design', 'branding') THEN 'graphics'
        WHEN service_type IN ('web_design', 'website', 'web_development') THEN 'web'
        WHEN service_type IN ('printing', 'print', 'merchandise') THEN 'printing'
        ELSE NULL
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_skill_from_service(TEXT) TO authenticated;

-- AI Description Polish Function (placeholder for AI integration)
CREATE OR REPLACE FUNCTION polish_description(raw_description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    polished TEXT;
BEGIN
    -- Clean up the description
    polished := TRIM(raw_description);
    polished := REGEXP_REPLACE(polished, '\s+', ' ', 'g');
    
    -- TODO: Integrate with AI API (OpenAI, Anthropic, etc.)
    -- For now, just return cleaned version
    -- In production: polished := call_openai_api(raw_description);
    
    RETURN polished;
END;
$$;

GRANT EXECUTE ON FUNCTION polish_description(TEXT) TO authenticated;

COMMENT ON FUNCTION get_skill_from_service IS 'Converts service type to skill category for worker matching';
COMMENT ON FUNCTION polish_description IS 'Polishes portfolio descriptions using AI (placeholder for API integration)';
