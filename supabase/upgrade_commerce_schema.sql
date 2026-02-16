-- COMMERCE & WORKFLOW EXTENSION
-- Adds Agreements, Payments, and Advanced Project States

-- 1. Create Agreements Table (Pricing Proposals)
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN',
    deliverables TEXT NOT NULL,
    timeline TEXT NOT NULL,
    client_agreed BOOLEAN DEFAULT false,
    freelancer_agreed BOOLEAN DEFAULT true, -- Start true since they proposed it
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('down_payment', 'final_payment')),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
    reference TEXT, -- Manual bank ref or Gateway ID
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Extend Project Files for Protection
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false; -- True until Paid

-- 4. Create Protected Storage Bucket (Private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('protected-files', 'protected-files', false)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS for Protected Files (Strict)
-- Only allow download if:
-- A) User is Uploader (Freelancer)
-- B) User is Admin
-- C) User is Client AND File is NOT locked
CREATE POLICY "protected_access_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'protected-files' AND (
        (storage.foldername(name))[1]::uuid IN (
            SELECT project_id FROM public.project_files 
            WHERE 
                (uploader_id = auth.uid()) OR -- Uploader
                (project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid()) AND is_locked = false) OR -- Client (Unlocked only)
                ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') -- Admin
        )
    )
);

-- 6. Enable Realtime for Agreements validation
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
