-- Add user_id column to reviewers if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviewers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reviewers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to flashcards if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flashcards' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE flashcards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Reviewer policies
DROP POLICY IF EXISTS "Users read own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users insert own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users update own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users delete own reviewers" ON reviewers;
CREATE POLICY "Users read own reviewers" ON reviewers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reviewers" ON reviewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviewers" ON reviewers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviewers" ON reviewers FOR DELETE USING (auth.uid() = user_id);

-- Flashcard policies
DROP POLICY IF EXISTS "Users read own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users delete own flashcards" ON flashcards;
CREATE POLICY "Users read own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviewers_user ON reviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_reviewer ON flashcards(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);

-- Username changed at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username_changed_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username_changed_at TIMESTAMPTZ;
  END IF;
END $$;
