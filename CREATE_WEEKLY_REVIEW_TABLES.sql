-- ============================================
-- Create weekly review and grace days tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add meta column to profiles table (if it doesn't exist)
-- This stores last_decay_run and other metadata
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meta JSONB;

-- Grace days table
-- Tracks grace days available per week (1 per week)
CREATE TABLE IF NOT EXISTS grace_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  used_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, week_start)
);

-- Weekly reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  strongest_area TEXT NOT NULL,
  weakest_area TEXT NOT NULL,
  total_actions INTEGER DEFAULT 0 NOT NULL,
  total_tokens INTEGER DEFAULT 0 NOT NULL,
  reflection TEXT,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE grace_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for grace_days
-- Using (true) to allow all operations - access control handled at app level via profile_id
CREATE POLICY "Users can view own grace days" ON grace_days
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own grace days" ON grace_days
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own grace days" ON grace_days
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own grace days" ON grace_days
  FOR DELETE
  USING (true);

-- Policies for weekly_reviews
CREATE POLICY "Users can view own weekly reviews" ON weekly_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own weekly reviews" ON weekly_reviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own weekly reviews" ON weekly_reviews
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own weekly reviews" ON weekly_reviews
  FOR DELETE
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grace_days_profile_id ON grace_days(profile_id);
CREATE INDEX IF NOT EXISTS idx_grace_days_week_start ON grace_days(profile_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_profile_id ON weekly_reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week_start ON weekly_reviews(profile_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_completed ON weekly_reviews(profile_id, completed, week_start DESC);
