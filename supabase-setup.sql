-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. User profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Admin emails table
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Study stats (one row per user per day)
CREATE TABLE IF NOT EXISTS study_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  known INT DEFAULT 0,
  forgot INT DEFAULT 0,
  dont_know INT DEFAULT 0,
  cards_total INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 4. Add your admin email (replace with your actual email)
INSERT INTO admin_emails (email) VALUES ('si.davidsdx@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_stats ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Anyone can read profiles (for leaderboard)
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);
-- Users can insert their own profile
CREATE POLICY "Insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update own profile
CREATE POLICY "Update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can read admin emails (to check admin status)
CREATE POLICY "Public read admin_emails" ON admin_emails FOR SELECT USING (true);

-- Anyone can read study stats (for leaderboard)
CREATE POLICY "Public read study_stats" ON study_stats FOR SELECT USING (true);
-- Users can insert their own stats
CREATE POLICY "Insert own stats" ON study_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own stats
CREATE POLICY "Update own stats" ON study_stats FOR UPDATE USING (auth.uid() = user_id);
