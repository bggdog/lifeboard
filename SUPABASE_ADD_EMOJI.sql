-- Add emoji column to habits table
-- Run this in your Supabase SQL Editor

ALTER TABLE habits ADD COLUMN IF NOT EXISTS emoji TEXT;
