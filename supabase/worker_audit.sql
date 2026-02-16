-- WORKER AUDIT
-- Let's see who we have.

SELECT id, full_name, role, skill, is_active, is_available 
FROM public.profiles 
WHERE role NOT IN ('client', 'admin');
