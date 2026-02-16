-- CHECK USER ROLE
SELECT email, role, is_available, specialization 
FROM public.profiles 
WHERE email = 'platinumfx24@gmail.com';
