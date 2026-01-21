-- ============================================
-- Create game layer tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add XP and level columns to profiles table (if they don't exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_tokens INTEGER NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reward redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cost_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actions_completed INTEGER DEFAULT 0 NOT NULL,
  tokens_earned INTEGER DEFAULT 0 NOT NULL,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, date)
);

-- Enable Row Level Security
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for rewards
-- Using (true) to allow all operations - access control handled at app level via profile_id
CREATE POLICY "Users can view own rewards" ON rewards
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own rewards" ON rewards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own rewards" ON rewards
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own rewards" ON rewards
  FOR DELETE
  USING (true);

-- Policies for reward_redemptions
CREATE POLICY "Users can view own redemptions" ON reward_redemptions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own redemptions" ON reward_redemptions
  FOR INSERT
  WITH CHECK (true);

-- Policies for daily_stats
CREATE POLICY "Users can view own daily stats" ON daily_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own daily stats" ON daily_stats
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own daily stats" ON daily_stats
  FOR UPDATE
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_profile_id ON rewards(profile_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_profile_id ON reward_redemptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_redeemed_at ON reward_redemptions(profile_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_profile_id ON daily_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(profile_id, date DESC);
