-- CHAT SCHEMA UPGRADE
-- Adds support for Voice Notes, Files, and Replies.

-- 1. Add missing columns to 'messages'
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'video', 'audio', 'file')),
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS is_voice_note BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id);

-- 2. Create Storage Bucket for Attachments (if not exists)
-- Note: This is usually done via UI, but we can attempt to insert into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Allow Authenticated Uploads)
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

-- 4. Enable Realtime for Messages (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
