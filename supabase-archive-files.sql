-- Archive file uploads: storage bucket for PDFs, DOCX, and other files
-- Run this in Supabase SQL Editor

-- Create storage bucket for archive files
INSERT INTO storage.buckets (id, name, public) VALUES ('archive-files', 'archive-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies (wrapped so re-runs don't fail)
DO $$ BEGIN
  CREATE POLICY "Archive files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'archive-files');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users can upload archive files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'archive-files' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users can update archive files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'archive-files' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users can delete archive files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'archive-files' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
