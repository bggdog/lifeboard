-- ============================================
-- Lifeboard Database Setup for Supabase
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- ============================================

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  token_reward INTEGER NOT NULL,
  category TEXT,
  schedule TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived BOOLEAN DEFAULT false
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  token_reward INTEGER,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  todo_order INTEGER NOT NULL
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
);

-- Dashboard modules table
CREATE TABLE IF NOT EXISTS dashboard_modules (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  position INTEGER NOT NULL,
  config TEXT
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (single-user app)
CREATE POLICY "Allow all operations on habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on habit_completions" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on todos" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on redemptions" ON redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on dashboard_modules" ON dashboard_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default dashboard modules
INSERT INTO dashboard_modules (id, type, position, config)
VALUES 
  ('1', 'token-balance', 0, NULL),
  ('2', 'habits', 1, NULL),
  ('3', 'todos', 2, NULL),
  ('4', 'journal', 3, NULL)
ON CONFLICT (id) DO NOTHING;
