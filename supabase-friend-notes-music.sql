-- Add song_preview and song_start_time columns to friend_notes
DO $$ BEGIN
  ALTER TABLE friend_notes ADD COLUMN song_preview TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE friend_notes ADD COLUMN song_start_time INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;