-- Clean up existing codes for test emails to avoid conflicts
DELETE FROM public.invite_codes 
WHERE email IN (
  'admin@plaiz.com', 
  'client@plaiz.com', 
  'graphic@plaiz.com', 
  'web@plaiz.com', 
  'print@plaiz.com'
);

-- Insert new universal test invite code (888888) for all test roles
-- These codes will be valid for 1 year
INSERT INTO public.invite_codes (email, code, role, used, expires_at)
VALUES 
  ('admin@plaiz.com', '888888', 'admin', false, now() + interval '1 year'),
  ('client@plaiz.com', '888888', 'client', false, now() + interval '1 year'),
  ('graphic@plaiz.com', '888888', 'worker', false, now() + interval '1 year'),
  ('web@plaiz.com', '888888', 'worker', false, now() + interval '1 year'),
  ('print@plaiz.com', '888888', 'worker', false, now() + interval '1 year');

-- Output verification
SELECT * FROM public.invite_codes 
WHERE code = '888888';
