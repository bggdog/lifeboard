-- Fix column names to use snake_case (PostgreSQL standard)
-- Run this in Supabase SQL Editor

-- Fix todos table
ALTER TABLE todos RENAME COLUMN "tokenReward" TO token_reward;
ALTER TABLE todos RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE todos RENAME COLUMN "completedAt" TO completed_at;
ALTER TABLE todos RENAME COLUMN "order" TO todo_order;

-- Fix habits table  
ALTER TABLE habits RENAME COLUMN "tokenReward" TO token_reward;
ALTER TABLE habits RENAME COLUMN "createdAt" TO created_at;

-- Fix habit_completions table
ALTER TABLE habit_completions RENAME COLUMN "habitId" TO habit_id;
ALTER TABLE habit_completions RENAME COLUMN "completedAt" TO completed_at;

-- Fix notes table
ALTER TABLE notes RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE notes RENAME COLUMN "updatedAt" TO updated_at;

-- Fix rewards table
ALTER TABLE rewards RENAME COLUMN "createdAt" TO created_at;

-- Fix redemptions table
ALTER TABLE redemptions RENAME COLUMN "rewardId" TO reward_id;
ALTER TABLE redemptions RENAME COLUMN "rewardName" TO reward_name;
ALTER TABLE redemptions RENAME COLUMN "redeemedAt" TO redeemed_at;

-- Fix dashboard_modules table
-- (no changes needed, already snake_case compatible)
