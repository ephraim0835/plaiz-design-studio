-- ==========================================
-- STORAGE BUCKETS INITIALIZATION
-- Ensures all buckets exist and have correct RLS
-- ==========================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', true),
  ('projects', 'projects', true),
  ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- AVATARS (Public Read, Owner Update)
-- ==========================================
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Owner Upload" ON storage.objects;
CREATE POLICY "Avatar Owner Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;
CREATE POLICY "Avatar Owner Update" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- ATTACHMENTS (Public Read, Authenticated Upload)
-- ==========================================
DROP POLICY IF EXISTS "Attachment Access" ON storage.objects;
CREATE POLICY "Attachment Access" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Attachment Upload" ON storage.objects;
CREATE POLICY "Attachment Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

-- ==========================================
-- PROJECTS/PORTFOLIO (Public Read, Worker/Admin Upload)
-- ==========================================
DROP POLICY IF EXISTS "Portfolio Public Access" ON storage.objects;
CREATE POLICY "Portfolio Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Portfolio Worker Upload" ON storage.objects;
CREATE POLICY "Portfolio Worker Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'projects' AND (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor')
        )
    )
);

-- ==========================================
-- PROJECT FILES (Private, Restricted)
-- ==========================================
DROP POLICY IF EXISTS "Protected File Access" ON storage.objects;
CREATE POLICY "Protected File Access" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'project-files' AND (
        -- Admin always access
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
        -- Owner/Uploader access
        owner = auth.uid() OR
        -- Participating client/worker access (Simplified check via subfolder if named by project_id)
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id::text = (storage.foldername(name))[1]
            AND (p.client_id = auth.uid() OR p.worker_id = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Protected File Upload" ON storage.objects;
CREATE POLICY "Protected File Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');
