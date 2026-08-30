DO $$ BEGIN
  CREATE TABLE study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('flashcards', 'quiz')),
    subject TEXT NOT NULL,
    module TEXT,
    deck_title TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    cards_studied INTEGER NOT NULL DEFAULT 0,
    known INTEGER NOT NULL DEFAULT 0,
    forgot INTEGER NOT NULL DEFAULT 0,
    dont_know INTEGER NOT NULL DEFAULT 0,
    score INTEGER,
    total_questions INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own study sessions" ON study_sessions;
  CREATE POLICY "Users can view own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert own study sessions" ON study_sessions;
  CREATE POLICY "Users can insert own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can delete own study sessions" ON study_sessions;
  CREATE POLICY "Users can delete own study sessions" ON study_sessions
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, created_at DESC);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
