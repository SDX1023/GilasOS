-- Doomscroll settings per user
CREATE TABLE IF NOT EXISTS doomscroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  benchmark_type TEXT NOT NULL DEFAULT 'cards', -- 'cards', 'minutes', 'quizzes'
  benchmark_target INT NOT NULL DEFAULT 50,      -- e.g. 50 cards, 30 minutes, 1 quiz
  scroll_duration_min INT NOT NULL DEFAULT 10,   -- minutes of scroll time unlocked
  search_query TEXT NOT NULL DEFAULT '',         -- YouTube search term for feed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Daily scroll usage tracking
CREATE TABLE IF NOT EXISTS doomscroll_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                -- new Date().toDateString()
  seconds_used INT NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE doomscroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doomscroll_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage settings" ON doomscroll_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner can manage usage" ON doomscroll_usage FOR ALL USING (auth.uid() = user_id);
