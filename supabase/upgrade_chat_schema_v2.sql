-- CHAT SCHEMA UPGRADE V2
-- Adds support for Voice Notes, Files, and Replies.
-- Removed the Realtime line since it is already active.

-- 1. Add missing columns to 'messages' (Safe to run multiple times)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'video', 'audio', 'file')),
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS is_voice_note BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id);

-- 2. Create Storage Bucket for Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Drop existing to avoid conflicts, then recreate
DROP POLICY IF EXISTS "authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_select" ON storage.objects;

CREATE POLICY "authenticated_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "authenticated_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');
