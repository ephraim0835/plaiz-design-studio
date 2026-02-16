-- Secure RPC function to fetch own profile
-- This bypasses standard RLS policies by running as SECURITY DEFINER but explicitly checking auth.uid()

CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    -- Explicitly verify the user is logged in
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT row_to_json(p) INTO result
    FROM profiles p
    WHERE p.id = auth.uid();

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_own_profile() TO authenticated;
