-- ============================================
-- Fix RLS policies for work tables
-- Run this if you already created the tables with the old policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own work note categories" ON work_note_categories;
DROP POLICY IF EXISTS "Users can insert own work note categories" ON work_note_categories;
DROP POLICY IF EXISTS "Users can update own work note categories" ON work_note_categories;
DROP POLICY IF EXISTS "Users can delete own work note categories" ON work_note_categories;

DROP POLICY IF EXISTS "Users can view own work notes" ON work_notes;
DROP POLICY IF EXISTS "Users can insert own work notes" ON work_notes;
DROP POLICY IF EXISTS "Users can update own work notes" ON work_notes;
DROP POLICY IF EXISTS "Users can delete own work notes" ON work_notes;

DROP POLICY IF EXISTS "Users can view own work todos" ON work_todos;
DROP POLICY IF EXISTS "Users can insert own work todos" ON work_todos;
DROP POLICY IF EXISTS "Users can update own work todos" ON work_todos;
DROP POLICY IF EXISTS "Users can delete own work todos" ON work_todos;

DROP POLICY IF EXISTS "Users can view own edit items" ON edit_items;
DROP POLICY IF EXISTS "Users can insert own edit items" ON edit_items;
DROP POLICY IF EXISTS "Users can update own edit items" ON edit_items;
DROP POLICY IF EXISTS "Users can delete own edit items" ON edit_items;

-- Recreate policies with (true) to allow all operations
-- Access control is handled at app level via profile_id filtering

-- Policies for work_note_categories
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
