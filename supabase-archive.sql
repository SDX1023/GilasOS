-- Archive table: shared competition records visible to everyone
DO $$ BEGIN
  CREATE TABLE archive_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition TEXT NOT NULL,
    competition_url TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE archive_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can read
DO $$ BEGIN
  CREATE POLICY "Anyone can read archive" ON archive_entries
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Only authenticated users can insert/update/delete (admin check is app-level)
DO $$ BEGIN
  CREATE POLICY "Auth users can insert archive" ON archive_entries
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users can update archive" ON archive_entries
    FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users can delete archive" ON archive_entries
    FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null;
END $$;