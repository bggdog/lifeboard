-- ============================================
-- Create work portal tables for LifeOS
-- Run this in Supabase SQL Editor
-- ============================================

-- Work Note Categories table
CREATE TABLE IF NOT EXISTS work_note_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_id, name)
);

-- Work Notes table
CREATE TABLE IF NOT EXISTS work_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES work_note_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Work Todos table
CREATE TABLE IF NOT EXISTS work_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  tokens INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Edit Items table
CREATE TABLE IF NOT EXISTS edit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('short_form', 'long_form', 'full_episode')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'done')),
  tokens INTEGER DEFAULT 2 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE work_note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_items ENABLE ROW LEVEL SECURITY;

-- Policies for work_note_categories
-- Using (true) to allow all operations - access control handled at app level via profile_id
CREATE POLICY "Users can view own work note categories" ON work_note_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own work note categories" ON work_note_categories
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own work note categories" ON work_note_categories
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own work note categories" ON work_note_categories
  FOR DELETE
  USING (true);

-- Policies for work_notes
CREATE POLICY "Users can view own work notes" ON work_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own work notes" ON work_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own work notes" ON work_notes
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own work notes" ON work_notes
  FOR DELETE
  USING (true);

-- Policies for work_todos
CREATE POLICY "Users can view own work todos" ON work_todos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own work todos" ON work_todos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own work todos" ON work_todos
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own work todos" ON work_todos
  FOR DELETE
  USING (true);

-- Policies for edit_items
CREATE POLICY "Users can view own edit items" ON edit_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own edit items" ON edit_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own edit items" ON edit_items
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own edit items" ON edit_items
  FOR DELETE
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_note_categories_profile_id ON work_note_categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_work_notes_profile_id ON work_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_work_notes_category_id ON work_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_work_todos_profile_id ON work_todos(profile_id);
CREATE INDEX IF NOT EXISTS idx_work_todos_completed ON work_todos(profile_id, completed);
CREATE INDEX IF NOT EXISTS idx_edit_items_profile_id ON edit_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_edit_items_type ON edit_items(profile_id, type);
CREATE INDEX IF NOT EXISTS idx_edit_items_status ON edit_items(profile_id, status);
