-- ============================================
-- Create habits and habit_completions tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  tokens INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, habit_id, date)
);

-- Enable Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for habits
CREATE POLICY "Users can view own habits" ON habits 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own habits" ON habits 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own habits" ON habits 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete own habits" ON habits 
  FOR DELETE 
  USING (true);

-- Create policies for habit_completions
CREATE POLICY "Users can view own habit completions" ON habit_completions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own habit completions" ON habit_completions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can delete own habit completions" ON habit_completions 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_profile_id ON habits(profile_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_profile_id ON habit_completions(profile_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_profile_habit_date ON habit_completions(profile_id, habit_id, date);
