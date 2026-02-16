-- REVERT USER TO CLIENT ROLE
-- Run this if your main account was accidentally converted to a designer.

UPDATE public.profiles
SET 
    role = 'client',
    specialization = NULL,
    is_available = false
WHERE email = 'platinumfx24@gmail.com';  -- Your email

-- Verify the change
SELECT email, role FROM public.profiles WHERE email = 'platinumfx24@gmail.com';
