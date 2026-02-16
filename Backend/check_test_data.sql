-- CHECK FOR TEST DATA
SELECT id, email, role, created_at FROM auth.users WHERE email LIKE 'autotest%';
SELECT * FROM public.profiles WHERE email LIKE 'autotest%';
SELECT * FROM public.projects WHERE title LIKE 'Queue Test Project%';
