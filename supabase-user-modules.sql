DO $$ BEGIN
  CREATE TABLE user_modules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#00d4ff',
    module_type TEXT DEFAULT 'custom' CHECK (module_type IN ('pdf', 'deck', 'custom')),
    module_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_modules_select" ON user_modules;
  CREATE POLICY "user_modules_select" ON user_modules FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_modules_insert" ON user_modules;
  CREATE POLICY "user_modules_insert" ON user_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_modules_update" ON user_modules;
  CREATE POLICY "user_modules_update" ON user_modules FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_modules_delete" ON user_modules;
  CREATE POLICY "user_modules_delete" ON user_modules FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
