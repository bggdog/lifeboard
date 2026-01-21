-- ============================================
-- COMPLETELY DROP ALL TABLES AND POLICIES
-- WARNING: This will DELETE EVERYTHING including table structure
-- Use this if you want to start completely fresh
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop all policies first
DROP POLICY IF EXISTS "Allow all operations on habits" ON habits;
DROP POLICY IF EXISTS "Allow all operations on habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Allow all operations on todos" ON todos;
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;
DROP POLICY IF EXISTS "Allow all operations on rewards" ON rewards;
DROP POLICY IF EXISTS "Allow all operations on redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow all operations on dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;
DROP POLICY IF EXISTS "Allow all operations on work_notes" ON work_notes;
DROP POLICY IF EXISTS "Allow all operations on edits" ON edits;
DROP POLICY IF EXISTS "Allow all operations on lifts" ON lifts;
DROP POLICY IF EXISTS "Allow all operations on lift_entries" ON lift_entries;

-- Drop user-specific policies
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
DROP POLICY IF EXISTS "Users can view own habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert own habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete own habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON todos;
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Users can insert own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Users can delete own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Users can view own dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can insert own dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can update own dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can delete own dashboard_modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can view own work_notes" ON work_notes;
DROP POLICY IF EXISTS "Users can insert own work_notes" ON work_notes;
DROP POLICY IF EXISTS "Users can update own work_notes" ON work_notes;
DROP POLICY IF EXISTS "Users can delete own work_notes" ON work_notes;
DROP POLICY IF EXISTS "Users can view own edits" ON edits;
DROP POLICY IF EXISTS "Users can insert own edits" ON edits;
DROP POLICY IF EXISTS "Users can update own edits" ON edits;
DROP POLICY IF EXISTS "Users can delete own edits" ON edits;
DROP POLICY IF EXISTS "Users can view own lifts" ON lifts;
DROP POLICY IF EXISTS "Users can insert own lifts" ON lifts;
DROP POLICY IF EXISTS "Users can update own lifts" ON lifts;
DROP POLICY IF EXISTS "Users can delete own lifts" ON lifts;
DROP POLICY IF EXISTS "Users can view own lift_entries" ON lift_entries;
DROP POLICY IF EXISTS "Users can insert own lift_entries" ON lift_entries;
DROP POLICY IF EXISTS "Users can update own lift_entries" ON lift_entries;
DROP POLICY IF EXISTS "Users can delete own lift_entries" ON lift_entries;

-- Drop tables in order (child tables first due to foreign keys)
DROP TABLE IF EXISTS lift_entries CASCADE;
DROP TABLE IF EXISTS lifts CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS work_notes CASCADE;
DROP TABLE IF EXISTS edits CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS dashboard_modules CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- All tables and policies have been dropped
-- You can now run a fresh setup script to recreate everything
