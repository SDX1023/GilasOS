-- Quiz history table
CREATE TABLE IF NOT EXISTS quiz_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_title TEXT NOT NULL DEFAULT 'Custom Quiz',
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  wrong_answers INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz history"
  ON quiz_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz history"
  ON quiz_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz history"
  ON quiz_history FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmarked cards table
CREATE TABLE IF NOT EXISTS bookmarked_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  deck_title TEXT NOT NULL DEFAULT '',
  card_front TEXT NOT NULL,
  card_back TEXT NOT NULL,
  card_hint TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookmarked_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarked_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarked_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarked_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_bookmarked_cards_unique
  ON bookmarked_cards (user_id, deck_id, card_front, card_back);
