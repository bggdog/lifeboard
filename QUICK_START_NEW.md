# Quick Start - New Supabase Project

## Step 1: Run the SQL Script

1. Go to your Supabase project: https://app.supabase.com
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the **ENTIRE** contents of `SUPABASE_SETUP_COMPLETE.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see: "Success. No rows returned"

## Step 2: Verify Environment Variables

Your `.env` file in the `server` directory should already be configured with:
- SUPABASE_URL=https://uujtatmznjwwuxzjyhfa.supabase.co
- SUPABASE_ANON_KEY=sb_publishable_oTFWMsxwP8n_a5RVNoqvzA_WdxqAiub

## Step 3: Start the Backend

```bash
cd server
npm run dev
```

You should see:
```
Server running on http://localhost:3001
Using Supabase database
Initialized default dashboard modules
```

## Step 4: Start the Frontend

In a new terminal:
```bash
npm run dev
```

## Step 5: Open the App

Go to: **http://localhost:5173**

Everything should work now! Try adding a habit or todo.
