-- StudyOS Database Schema for Supabase
-- Run this in SQL Editor to reset everything

-- Drop existing policies and tables (safe to run multiple times)
DROP POLICY IF EXISTS "Public read" ON courses;
DROP POLICY IF EXISTS "Admin insert" ON courses;
DROP POLICY IF EXISTS "Admin update" ON courses;
DROP POLICY IF EXISTS "Admin delete" ON courses;
DROP POLICY IF EXISTS "Public read" ON modules;
DROP POLICY IF EXISTS "Admin insert" ON modules;
DROP POLICY IF EXISTS "Admin update" ON modules;
DROP POLICY IF EXISTS "Admin delete" ON modules;
DROP POLICY IF EXISTS "Public read" ON notes;
DROP POLICY IF EXISTS "Admin insert" ON notes;
DROP POLICY IF EXISTS "Admin update" ON notes;
DROP POLICY IF EXISTS "Admin delete" ON notes;
DROP POLICY IF EXISTS "Public read" ON reviewers;
DROP POLICY IF EXISTS "Admin insert" ON reviewers;
DROP POLICY IF EXISTS "Admin update" ON reviewers;
DROP POLICY IF EXISTS "Admin delete" ON reviewers;
DROP POLICY IF EXISTS "Public read" ON flashcards;
DROP POLICY IF EXISTS "Admin insert" ON flashcards;
DROP POLICY IF EXISTS "Admin update" ON flashcards;
DROP POLICY IF EXISTS "Admin delete" ON flashcards;

DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS reviewers CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create tables
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, module_id, slug)
);

CREATE TABLE reviewers (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_notes_module ON notes(module_id);
CREATE INDEX idx_notes_course ON notes(course_id);
CREATE INDEX idx_reviewers_module ON reviewers(module_id);
CREATE INDEX idx_reviewers_course ON reviewers(course_id);
CREATE INDEX idx_flashcards_reviewer ON flashcards(reviewer_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Allow everything for anon (this app has no user accounts)
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on modules" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reviewers" ON reviewers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on flashcards" ON flashcards FOR ALL USING (true) WITH CHECK (true);
