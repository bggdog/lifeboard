-- Add gym notes tables to your Supabase database
-- Run this AFTER running SUPABASE_SETUP_COMPLETE.sql
-- Copy and paste into Supabase SQL Editor

-- Lifts table
CREATE TABLE IF NOT EXISTS lifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  current_weight NUMERIC NOT NULL DEFAULT 0,
  one_rep_max NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Lift entries table (workout logs)
CREATE TABLE IF NOT EXISTS lift_entries (
  id TEXT PRIMARY KEY,
  lift_id TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lift_id) REFERENCES lifts(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lift_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (single-user app)
CREATE POLICY "Allow all operations on lifts" ON lifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lift_entries" ON lift_entries FOR ALL USING (true) WITH CHECK (true);
