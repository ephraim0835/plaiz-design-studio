-- COMPREHENSIVE FIX: Gallery & Storage
-- Run this to fix Schema, Storage Permissions, and Data Visibility

-- 1. SCHEMA: Ensure 'portfolio' has all required columns
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id);

-- 2. DATA: Force Approval & Integrity
-- Fix any items that might have been inserted as unapproved
UPDATE public.portfolio SET is_approved = true WHERE is_approved IS NOT true;

-- 3. STORAGE: Fix Upload Permissions (The missing link?)
-- Even if bucket is public, we need RLS for objects to allow INSERT/DELETE
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'projects' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'projects' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'projects' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Public Read" ON storage.objects
FOR SELECT USING (bucket_id = 'projects');

-- 4. DIAGNOSTIC: Show us what we have
SELECT 
    count(*) as total_items, 
    sum(case when is_approved then 1 else 0 end) as approved_items,
    sum(case when image_url is null then 1 else 0 end) as missing_images
FROM public.portfolio;

-- 5. List the actual items to verify
SELECT title, is_approved, service_type, image_url FROM public.portfolio ORDER BY created_at DESC LIMIT 5;
