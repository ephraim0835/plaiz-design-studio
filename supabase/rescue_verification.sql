-- RESCUE SCRIPT: Auto-Verify Workers for Testing
-- Run this to quickly verify all your designers so the matching logic can pick them up.

-- 1. Create dummy bank accounts for workers who don't have one
INSERT INTO public.bank_accounts (worker_id, bank_name, bank_code, account_number, account_name, is_verified)
SELECT 
    id, 
    'Plaiz Test Bank', 
    '000', 
    '0000000000', 
    full_name, 
    true
FROM public.profiles 
WHERE role NOT IN ('client', 'admin')
AND id NOT IN (SELECT worker_id FROM public.bank_accounts)
ON CONFLICT (worker_id) DO UPDATE SET is_verified = true;

-- 2. Force verify all existing bank accounts
UPDATE public.bank_accounts 
SET is_verified = true 
WHERE is_verified = false;

-- 3. Ensure workers are active and available
UPDATE public.profiles 
SET is_active = true, is_available = true 
WHERE role NOT IN ('client', 'admin');

-- 4. Initialize worker_stats if missing
INSERT INTO public.worker_stats (worker_id, average_rating, total_projects, active_projects)
SELECT id, 5.0, 0, 0
FROM public.profiles
WHERE role NOT IN ('client', 'admin')
AND id NOT IN (SELECT worker_id FROM public.worker_stats)
ON CONFLICT (worker_id) DO NOTHING;
