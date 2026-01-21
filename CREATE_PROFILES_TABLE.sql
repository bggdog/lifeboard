-- ============================================
-- Create profiles table for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles table for anonymous and authenticated users
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  token_balance INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (single-user app)
-- Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
