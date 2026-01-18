-- Add edits table to your Supabase database
-- Run this AFTER running SUPABASE_SETUP_COMPLETE.sql and SUPABASE_ADD_WORK_NOTES.sql
-- Copy and paste into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS edits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

-- Enable Row Level Security
ALTER TABLE edits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (single-user app)
CREATE POLICY "Allow all operations on edits" ON edits FOR ALL USING (true) WITH CHECK (true);
