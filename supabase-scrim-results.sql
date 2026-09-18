-- Run this in Supabase SQL Editor

-- Scrim results (history)
CREATE TABLE IF NOT EXISTS scrim_results (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_title TEXT NOT NULL DEFAULT 'Untitled',
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  timed_out INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  questions_json TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scrim_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scrim results"
  ON scrim_results FOR ALL USING (auth.uid() = user_id);

-- Saved scrims (replayable)
CREATE TABLE IF NOT EXISTS saved_scrims (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  doc_text TEXT NOT NULL DEFAULT '',
  questions_json TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE saved_scrims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved scrims"
  ON saved_scrims FOR ALL USING (auth.uid() = user_id);
