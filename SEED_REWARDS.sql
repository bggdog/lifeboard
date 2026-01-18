-- Seed initial rewards into your Supabase database
-- Run this AFTER running SUPABASE_SETUP_COMPLETE.sql
-- Copy and paste into Supabase SQL Editor

INSERT INTO rewards (id, name, description, price, created_at)
VALUES 
  ('reward-golf-9hole', 'Round of 9 hole golf', NULL, 1000, NOW()::text),
  ('reward-roadhouse-steak', 'Chicken fried steak at roadhouse', NULL, 1500, NOW()::text),
  ('reward-video-games', '1 Hour of video games', NULL, 650, NOW()::text),
  ('reward-basketball', 'Basketball shootaround', NULL, 250, NOW()::text),
  ('reward-movie-date', 'Movie date', NULL, 1200, NOW()::text)
ON CONFLICT (id) DO NOTHING;
