# Quick Fix for Database Column Names

The issue is that Supabase has trouble with quoted column names like `"createdAt"`. 

## Option 1: Run the Migration SQL (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Open **SQL Editor**
3. Copy and paste the contents of `SUPABASE_FIX_COLUMNS.sql`
4. Click **Run**

This will rename all columns to snake_case which works better with Supabase.

## Option 2: Recreate Tables (If migration fails)

If the migration doesn't work, you can drop and recreate the tables. **WARNING: This will delete all your data!**

Run this in SQL Editor:

```sql
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS dashboard_modules CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Then run the fixed SQL from SUPABASE_SETUP.md but with snake_case column names
```

## After Running the Fix

Restart your backend server:
```bash
cd server
npm run dev
```

Then try adding a todo again - it should work!
