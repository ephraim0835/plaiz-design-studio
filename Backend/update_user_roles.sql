-- Make a user an Admin
-- Replace 'YOUR_EMAIL@example.com' with the email of the user you want to update
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@example.com';

-- Make a user a Worker (e.g., Web Designer)
UPDATE profiles 
SET role = 'worker', specialization = 'Web Designer' 
WHERE email = 'YOUR_WORKER_EMAIL@example.com';

-- Reset to Client
UPDATE profiles 
SET role = 'client', specialization = NULL 
WHERE email = 'YOUR_CLIENT_EMAIL@example.com';
