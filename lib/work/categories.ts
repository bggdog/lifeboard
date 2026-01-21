// Work note categories data layer
import { supabase } from '../supabase/client';

export interface WorkNoteCategory {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

/**
 * Fetch all work note categories for a profile
 */
export async function fetchCategories(profileId: string): Promise<WorkNoteCategory[]> {
  const { data, error } = await supabase
    .from('work_note_categories')
    .select('*')
    .eq('profile_id', profileId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching work note categories:', error);
    throw error;
  }

  return (data || []) as WorkNoteCategory[];
}

/**
 * Create a new work note category
 */
export async function createCategory(
  profileId: string,
  name: string
): Promise<WorkNoteCategory> {
  const { data, error } = await supabase
    .from('work_note_categories')
    .insert({
      profile_id: profileId,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating work note category:', error);
    throw error;
  }

  return data as WorkNoteCategory;
}

/**
 * Delete a work note category
 * Sets category_id to null for all notes in this category
 */
export async function deleteCategory(id: string, profileId: string): Promise<void> {
  // First, remove category from all notes
  const { error: updateError } = await supabase
    .from('work_notes')
    .update({ category_id: null })
    .eq('category_id', id)
    .eq('profile_id', profileId);

  if (updateError) {
    console.error('Error removing category from notes:', updateError);
    throw updateError;
  }

  // Then delete the category
  const { error: deleteError } = await supabase
    .from('work_note_categories')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId);

  if (deleteError) {
    console.error('Error deleting work note category:', deleteError);
    throw deleteError;
  }
}
