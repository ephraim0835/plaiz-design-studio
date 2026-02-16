-- Add columns for attachments
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Create storage bucket for attachments if it doesn't exist
-- Note: Buckets are usually created via API/Dashboard, but we can try inserting if storage schema is accessible
-- or we rely on the user to create 'attachments' bucket in Supabase Dashboard.

-- Policy to allow authenticated users to upload to 'attachments' bucket
-- This assumes the bucket is named 'attachments'
-- create policy "Allow authenticated uploads"
-- on storage.objects for insert
-- to authenticated
-- with check ( bucket_id = 'attachments' );

-- create policy "Allow authenticated downloads"
-- on storage.objects for select
-- to authenticated
-- using ( bucket_id = 'attachments' );
