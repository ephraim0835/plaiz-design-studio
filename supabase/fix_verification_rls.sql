-- FIX VERIFICATION RLS
-- Allows admins to update worker verification status and logs

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. Verification Audit Logs Policies
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.verification_audit_logs;

CREATE POLICY "Admins can manage audit logs"
ON public.verification_audit_logs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Also allow workers to view their own audit logs (optional but good practice)
DROP POLICY IF EXISTS "Workers can view own audit logs" ON public.verification_audit_logs;
CREATE POLICY "Workers can view own audit logs"
ON public.verification_audit_logs
FOR SELECT
TO authenticated
USING (worker_id = auth.uid());
