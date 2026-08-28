-- Flashcard reviewers and cards, tied to user accounts
-- Run this in Supabase SQL Editor

-- Reviewers (decks of flashcards)
CREATE TABLE IF NOT EXISTS reviewers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT REFERENCES reviewers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT DEFAULT '',
  known INT DEFAULT 0,
  "dontKnow" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only read/write their own reviewers
CREATE POLICY "Users read own reviewers" ON reviewers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reviewers" ON reviewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviewers" ON reviewers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviewers" ON reviewers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: users can only read/write their own flashcards
CREATE POLICY "Users read own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_reviewers_user ON reviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewers_course_module ON reviewers(course_id, module_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_reviewer ON flashcards(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
