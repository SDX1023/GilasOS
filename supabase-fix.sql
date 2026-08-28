-- Run this in Supabase SQL Editor to fix the RLS policy

-- Drop old policies
DROP POLICY IF EXISTS "Insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Update own profile" ON user_profiles;

-- Recreate with working policies
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
