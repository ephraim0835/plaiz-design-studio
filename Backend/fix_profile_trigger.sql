-- 1. Create the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Manually fix the specific user who is stuck (ID extracted from logs)
-- We insert a default admin profile for them so they can access the dashboard.
INSERT INTO public.profiles (id, full_name, role, specialization)
VALUES (
    '957c86c4-9c50-4e88-a298-d8dc556463d9', -- User ID from your browser logs
    'Admin User',
    'admin', 
    'System Administrator'
)
ON CONFLICT (id) DO NOTHING;
