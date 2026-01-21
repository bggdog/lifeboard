-- ============================================
-- Create gym portal tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Gym Lifts table
CREATE TABLE IF NOT EXISTS gym_lifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  UNIQUE(profile_id, name)
);

-- Gym Sets table
CREATE TABLE IF NOT EXISTS gym_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lift_id UUID NOT NULL REFERENCES gym_lifts(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  notes TEXT,
  tokens INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE gym_lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_sets ENABLE ROW LEVEL SECURITY;

-- Policies for gym_lifts
-- Using (true) to allow all operations - access control handled at app level via profile_id
CREATE POLICY "Users can view own gym lifts" ON gym_lifts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own gym lifts" ON gym_lifts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own gym lifts" ON gym_lifts
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own gym lifts" ON gym_lifts
  FOR DELETE
  USING (true);

-- Policies for gym_sets
CREATE POLICY "Users can view own gym sets" ON gym_sets
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own gym sets" ON gym_sets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own gym sets" ON gym_sets
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own gym sets" ON gym_sets
  FOR DELETE
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gym_lifts_profile_id ON gym_lifts(profile_id);
CREATE INDEX IF NOT EXISTS idx_gym_lifts_active ON gym_lifts(profile_id, active);
CREATE INDEX IF NOT EXISTS idx_gym_sets_profile_id ON gym_sets(profile_id);
CREATE INDEX IF NOT EXISTS idx_gym_sets_lift_id ON gym_sets(lift_id);
CREATE INDEX IF NOT EXISTS idx_gym_sets_performed_at ON gym_sets(profile_id, lift_id, performed_at DESC);
