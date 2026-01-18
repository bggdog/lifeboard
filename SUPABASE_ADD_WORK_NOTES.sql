-- Add work_notes table to your Supabase database
-- Run this AFTER running SUPABASE_SETUP_COMPLETE.sql
-- Copy and paste into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS work_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE work_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (single-user app)
CREATE POLICY "Allow all operations on work_notes" ON work_notes FOR ALL USING (true) WITH CHECK (true);

-- Update todos table to support work todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_work BOOLEAN DEFAULT false;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS work_date TEXT;
