-- ============================================
-- Create activity_events table for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Activity events table for logging token transactions
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  meta JSONB
);

-- Enable Row Level Security
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Users can view own activity" ON activity_events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own activity" ON activity_events 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_events_profile_id ON activity_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_source ON activity_events(source_table, source_id);
