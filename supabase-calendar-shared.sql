-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  event_type TEXT DEFAULT 'study',
  linked_todo_id TEXT DEFAULT '',
  linked_deck_id TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events (user_id, event_date);

-- Shared decks
CREATE TABLE IF NOT EXISTS shared_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cards JSONB NOT NULL DEFAULT '[]',
  author_name TEXT DEFAULT 'Anonymous',
  course_id TEXT DEFAULT '',
  copies INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shared_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shared decks" ON shared_decks FOR SELECT USING (true);
CREATE POLICY "Users can insert own shared decks" ON shared_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own shared decks" ON shared_decks FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own shared decks" ON shared_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_shared_decks_created ON shared_decks (created_at DESC);

-- Flashcard images
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]';
