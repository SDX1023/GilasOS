-- Friend Notes: Instagram/Messenger style notes visible to friends (24hr expiry)
DO $$ BEGIN
  CREATE TABLE friend_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 200),
    song_name TEXT,
    song_artist TEXT,
    song_url TEXT,
    song_album_art TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE friend_notes ENABLE ROW LEVEL SECURITY;

-- Users can see notes from their accepted friends + their own notes
DO $$ BEGIN
  CREATE POLICY "Users see friend notes" ON friend_notes
    FOR SELECT USING (
      user_id = auth.uid()
      OR user_id IN (
        SELECT CASE
          WHEN requester_id = auth.uid() THEN addressee_id
          WHEN addressee_id = auth.uid() THEN requester_id
        END
        FROM user_friends
        WHERE status = 'accepted'
        AND (requester_id = auth.uid() OR addressee_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can insert their own notes
DO $$ BEGIN
  CREATE POLICY "Users can post notes" ON friend_notes
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can update their own notes
DO $$ BEGIN
  CREATE POLICY "Users can update own notes" ON friend_notes
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can delete their own notes
DO $$ BEGIN
  CREATE POLICY "Users can delete own notes" ON friend_notes
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_friend_notes_user ON friend_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_notes_expires ON friend_notes(expires_at);
