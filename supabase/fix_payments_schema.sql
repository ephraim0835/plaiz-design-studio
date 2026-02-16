-- FIX: Add missing columns to payments table
-- This is required for the Payment Processing RPC

DO $$
BEGIN
    -- Check and add client_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN client_id UUID REFERENCES auth.users(id);
    END IF;

    -- Check and add amount (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'amount'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN amount NUMERIC DEFAULT 0;
    END IF;

    -- Check and add reference (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'reference'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN reference TEXT;
    END IF;

    -- Check and add status (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Check and add type (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN type TEXT DEFAULT 'project_milestone';
    END IF;

END $$;
