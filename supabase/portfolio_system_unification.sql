-- Portfolio Unification and Permissions Migration
-- This script unifies gallery_items functionality into the portfolio table
-- and implements the requested role-based upload permissions.

-- 1. Add missing columns to portfolio table
ALTER TABLE portfolio 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT DEFAULT 'worker';

-- 2. Ensure service_type/category consistency
-- (Using existing service_type as the category field)

-- 3. Update existing records (optional, but good for consistency)
UPDATE portfolio SET is_approved = TRUE WHERE is_approved IS NULL;

-- 4. Enable RLS
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies

-- ALL: Everyone can select approved portfolio items
DROP POLICY IF EXISTS "Anyone can view approved portfolio items" ON portfolio;
CREATE POLICY "Anyone can view approved portfolio items" 
ON portfolio FOR SELECT 
USING (is_approved = TRUE);

-- ADMIN: Full control (override)
DROP POLICY IF EXISTS "Admins have full control over portfolio" ON portfolio;
CREATE POLICY "Admins have full control over portfolio" 
ON portfolio FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- WORKER: Restricted Upload
DROP POLICY IF EXISTS "Workers can upload within their skill" ON portfolio;
CREATE POLICY "Workers can upload within their skill" 
ON portfolio FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor')
    AND (
      (role = 'graphic_designer' AND service_type = 'graphics') OR
      (role = 'web_designer' AND service_type = 'web') OR
      (role = 'print_specialist' AND service_type = 'printing') OR
      -- General worker role might need flexibility or specific skill check
      (role = 'worker' AND service_type = skill)
    )
  )
  AND worker_id = auth.uid()
);

-- WORKER: Restricted Delete
DROP POLICY IF EXISTS "Workers can delete their own items" ON portfolio;
CREATE POLICY "Workers can delete their own items" 
ON portfolio FOR DELETE 
TO authenticated
USING (
  worker_id = auth.uid()
);

-- 6. Trigger for Admin Notifications
CREATE OR REPLACE FUNCTION notify_admin_of_portfolio_upload()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    worker_name TEXT;
BEGIN
    -- Only notify if uploaded by a non-admin
    IF (SELECT role FROM profiles WHERE id = NEW.worker_id) != 'admin' THEN
        -- Get worker name
        SELECT full_name INTO worker_name FROM profiles WHERE id = NEW.worker_id;
        
        -- Get at least one admin ID
        SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
        
        IF admin_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link, is_read)
            VALUES (
                admin_id,
                'New portfolio upload by ' || COALESCE(worker_name, 'a worker'),
                'New work in ' || NEW.service_type || ': ' || NEW.title,
                '/admin/gallery', -- Or appropriate link
                FALSE
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_portfolio_upload ON portfolio;
CREATE TRIGGER on_portfolio_upload
AFTER INSERT ON portfolio
FOR EACH ROW
EXECUTE FUNCTION notify_admin_of_portfolio_upload();
