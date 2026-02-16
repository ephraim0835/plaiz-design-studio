-- FINAL AVAILABILITY FIX
-- Run this to clear the error and fix permissions.

-- 1. Drop the old function explicitly (Required to change return type)
DROP FUNCTION IF EXISTS public.check_service_availability();

-- 2. Define the new function
CREATE OR REPLACE FUNCTION public.check_service_availability()
RETURNS TABLE (
    service_id TEXT,
    service_title TEXT,
    service_description TEXT,
    service_icon TEXT,
    required_role TEXT,
    available_worker_count INTEGER,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH services AS (
        SELECT * FROM (VALUES
            ('graphic_design', 'Graphic Design', 'Branding, logos, and visual identity.', 'Sparkles', 'graphic_designer'),
            ('web_design', 'Web Design', 'Modern, responsive websites and platforms.', 'Globe', 'web_designer'),
            ('print_specialist', 'Print Media', 'High-quality print and physical assets.', 'Printer', 'print_specialist'),
            ('ui_ux', 'UI/UX Design', 'Intelligent user interfaces and experiences.', 'Layout', 'ui_ux')
        ) AS t(id, title, descr, icon, role)
    )
    SELECT 
        s.id,
        s.title,
        s.descr,
        s.icon,
        s.role,
        (
            SELECT COUNT(*)::INTEGER
            FROM public.profiles p
            JOIN public.worker_stats ws ON p.id = ws.worker_id
            WHERE p.role = s.role
            AND ws.active_projects < 3 -- Capacity check
            AND p.is_available = true -- User switch check
        ),
        (
            SELECT COUNT(*)::INTEGER
            FROM public.profiles p
            JOIN public.worker_stats ws ON p.id = ws.worker_id
            WHERE p.role = s.role
            AND ws.active_projects < 3
            AND p.is_available = true
        ) > 0
    FROM services s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.check_service_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_service_availability() TO service_role;
GRANT EXECUTE ON FUNCTION public.find_best_worker(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_best_worker(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_match_score(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_match_score(UUID, TEXT, TEXT) TO service_role;
