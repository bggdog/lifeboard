# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: Lifeboard (or any name you like)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be ready

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Create the Database Tables

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy and paste this SQL:

```sql
-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "tokenReward" INTEGER NOT NULL,
  category TEXT,
  schedule TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  archived BOOLEAN DEFAULT false
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  "habitId" TEXT NOT NULL,
  date TEXT NOT NULL,
  "completedAt" TEXT NOT NULL,
  FOREIGN KEY ("habitId") REFERENCES habits(id) ON DELETE CASCADE
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  "tokenReward" INTEGER,
  "createdAt" TEXT NOT NULL,
  "completedAt" TEXT,
  "order" INTEGER NOT NULL
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  "rewardId" TEXT NOT NULL,
  "rewardName" TEXT NOT NULL,
  price INTEGER NOT NULL,
  "redeemedAt" TEXT NOT NULL,
  FOREIGN KEY ("rewardId") REFERENCES rewards(id) ON DELETE CASCADE
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

-- Enable Row Level Security (RLS) - but allow all for single user
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since it's single-user)
CREATE POLICY "Allow all operations" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON dashboard_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON settings FOR ALL USING (true) WITH CHECK (true);
```

4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

1. In the `server` directory, create a `.env` file:
```bash
cd server
touch .env
```

2. Add your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3001
```

Replace with your actual values from Step 2.

## Step 5: Install Dependencies

```bash
cd server
npm install
```

## Step 6: Start the Server

```bash
npm run dev
```

You should see:
```
Server running on http://localhost:3001
Using Supabase database
Initialized default dashboard modules
```

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created the `.env` file in the `server` directory
- Check that the variable names are exactly: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### "relation does not exist"
- Make sure you ran the SQL script in Step 3
- Check the SQL Editor for any errors

### "new row violates row-level security policy"
- Make sure you created the RLS policies in Step 3
- Check that the policies allow all operations

## For Vercel Deployment

When deploying to Vercel:
1. Add the environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. The backend will automatically use these in production
