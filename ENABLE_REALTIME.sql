-- Enable Realtime for tables in Supabase
-- Run this in the Supabase SQL Editor

-- First, check if the publication exists and add tables to it
-- Note: The publication name might be different, try both:

-- Option 1: Standard Supabase publication
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE work_todos;
ALTER PUBLICATION supabase_realtime ADD TABLE edit_items;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE gym_sets;

-- If the above doesn't work, try creating the publication first:
-- CREATE PUBLICATION supabase_realtime FOR TABLE habits, habit_completions, todos, work_todos, edit_items, profiles, daily_stats, gym_sets;

-- Alternative: Enable via pg_publication
-- SELECT pg_create_publication('supabase_realtime', FOR ALL TABLES);
