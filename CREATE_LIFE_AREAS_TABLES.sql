-- ============================================
-- Create life_areas and life_area_scores tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Life areas table
CREATE TABLE IF NOT EXISTS life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, name)
);

-- Life area scores table
CREATE TABLE IF NOT EXISTS life_area_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  life_area_id UUID NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  meta JSONB,
  UNIQUE(profile_id, life_area_id)
);

-- Add life_area_id column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_area_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for life_areas
CREATE POLICY "Users can view own life areas" ON life_areas 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own life areas" ON life_areas 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own life areas" ON life_areas 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete own life areas" ON life_areas 
  FOR DELETE 
  USING (true);

-- Create policies for life_area_scores
CREATE POLICY "Users can view own life area scores" ON life_area_scores 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own life area scores" ON life_area_scores 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own life area scores" ON life_area_scores 
  FOR UPDATE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_life_areas_profile_id ON life_areas(profile_id);
CREATE INDEX IF NOT EXISTS idx_life_area_scores_profile_id ON life_area_scores(profile_id);
CREATE INDEX IF NOT EXISTS idx_life_area_scores_life_area_id ON life_area_scores(life_area_id);
CREATE INDEX IF NOT EXISTS idx_habits_life_area_id ON habits(life_area_id);
