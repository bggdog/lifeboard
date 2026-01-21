-- ============================================
-- Create todos table for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Todos table
-- Note: Using UUID for id, TEXT for profile_id to match profiles.id type
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  tokens INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Users can view own todos" ON todos 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own todos" ON todos 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own todos" ON todos 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete own todos" ON todos 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_profile_id ON todos(profile_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
