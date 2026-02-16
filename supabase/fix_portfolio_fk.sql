-- FIX: Portfolio Foreign Key Relationship
-- The frontend query fails if it can't join 'portfolio' to 'profiles' via 'worker_id'

-- 1. Dropping existing constraint if it exists (to start fresh)
ALTER TABLE public.portfolio DROP CONSTRAINT IF EXISTS portfolio_worker_id_fkey;

-- 2. Validate data before constraint (avoid errors)
-- Set invalid worker_ids to NULL to prevent constraint violation
UPDATE public.portfolio 
SET worker_id = NULL 
WHERE worker_id IS NOT NULL 
AND worker_id NOT IN (SELECT id FROM public.profiles);

-- 3. Add the Foreign Key Constraint explicitly
ALTER TABLE public.portfolio 
ADD CONSTRAINT portfolio_worker_id_fkey 
FOREIGN KEY (worker_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 4. Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio';

-- 5. Force update 'service_type' to standard lowercase values (fixes filtering)
UPDATE public.portfolio SET service_type = 'graphics' WHERE service_type ILIKE 'graphic%';
UPDATE public.portfolio SET service_type = 'web' WHERE service_type ILIKE 'web%';
UPDATE public.portfolio SET service_type = 'printing' WHERE service_type ILIKE 'print%';
