-- ============================================
-- Add user authentication to all tables
-- Run this AFTER enabling Supabase Auth
-- ============================================

-- Add user_id column to all tables
ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE habit_completions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE dashboard_modules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE work_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE edits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lift_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old policies
DROP POLICY IF EXISTS "Allow all operations on habits" ON habits;
DROP POLICY IF EXISTS "Allow all operations on habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Allow all operations on todos" ON todos;
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;
DROP POLICY IF EXISTS "Allow all operations on rewards" ON rewards;
DROP POLICY IF EXISTS "Allow all operations on redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow all operations on dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;
DROP POLICY IF EXISTS "Allow all operations on work_notes" ON work_notes;
DROP POLICY IF EXISTS "Allow all operations on edits" ON edits;
DROP POLICY IF EXISTS "Allow all operations on lifts" ON lifts;
DROP POLICY IF EXISTS "Allow all operations on lift_entries" ON lift_entries;

-- Create new policies that filter by user_id
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habit_completions" ON habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit_completions" ON habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit_completions" ON habit_completions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON todos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rewards" ON rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rewards" ON rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rewards" ON rewards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rewards" ON rewards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own redemptions" ON redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own redemptions" ON redemptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own dashboard_modules" ON dashboard_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dashboard_modules" ON dashboard_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dashboard_modules" ON dashboard_modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dashboard_modules" ON dashboard_modules FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own work_notes" ON work_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work_notes" ON work_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work_notes" ON work_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work_notes" ON work_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own edits" ON edits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own edits" ON edits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edits" ON edits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own edits" ON edits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lifts" ON lifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lifts" ON lifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lifts" ON lifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lifts" ON lifts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lift_entries" ON lift_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lift_entries" ON lift_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lift_entries" ON lift_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lift_entries" ON lift_entries FOR DELETE USING (auth.uid() = user_id);
