CREATE TABLE IF NOT EXISTS saved_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Saved Quiz',
  source TEXT NOT NULL DEFAULT 'custom',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_questions INT NOT NULL DEFAULT 0,
  shared BOOLEAN DEFAULT false,
  share_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved quizzes" ON saved_quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read shared quizzes" ON saved_quizzes FOR SELECT USING (shared = true);
CREATE POLICY "Users can insert their own saved quizzes" ON saved_quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved quizzes" ON saved_quizzes FOR DELETE USING (auth.uid() = user_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own saved quizzes" ON saved_quizzes;
  CREATE POLICY "Users can update own saved quizzes" ON saved_quizzes FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_quizzes_user ON saved_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_quizzes_share ON saved_quizzes(share_code) WHERE share_code IS NOT NULL;
