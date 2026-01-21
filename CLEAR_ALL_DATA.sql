-- ============================================
-- Clear All Data from Database
-- This will DELETE all data but keep the table structure
-- Run this in Supabase SQL Editor
-- ============================================

-- Delete in order to respect foreign key constraints
-- (Delete child tables first, then parent tables)

-- Delete all data from tables
DELETE FROM lift_entries;
DELETE FROM lifts;
DELETE FROM redemptions;
DELETE FROM habit_completions;
DELETE FROM todos;
DELETE FROM notes;
DELETE FROM work_notes;
DELETE FROM edits;
DELETE FROM rewards;
DELETE FROM habits;
DELETE FROM dashboard_modules;
DELETE FROM settings;

-- Verify tables are empty (optional - you can run these to check)
-- SELECT COUNT(*) FROM habits;
-- SELECT COUNT(*) FROM todos;
-- SELECT COUNT(*) FROM notes;
-- etc.
