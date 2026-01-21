// Work notes data layer
import { supabase } from '../supabase/client';

export interface WorkNote {
  id: string;
  profile_id: string;
  category_id: string | null;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all work notes for a profile
 */
export async function fetchNotes(profileId: string): Promise<WorkNote[]> {
  const { data, error } = await supabase
    .from('work_notes')
    .select('*')
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching work notes:', error);
    throw error;
  }

  return (data || []) as WorkNote[];
}

/**
 * Create a new work note
 */
export async function createNote(
  profileId: string,
  params: {
    title: string;
    body: string;
    categoryId?: string | null;
  }
): Promise<WorkNote> {
  const { data, error } = await supabase
    .from('work_notes')
    .insert({
      profile_id: profileId,
      title: params.title.trim(),
      body: params.body.trim(),
      category_id: params.categoryId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating work note:', error);
    throw error;
  }

  return data as WorkNote;
}

/**
 * Update a work note
 */
export async function updateNote(
  id: string,
  params: {
    title?: string;
    body?: string;
    categoryId?: string | null;
  }
): Promise<WorkNote> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (params.title !== undefined) updateData.title = params.title.trim();
  if (params.body !== undefined) updateData.body = params.body.trim();
  if (params.categoryId !== undefined) updateData.category_id = params.categoryId || null;

  const { data, error } = await supabase
    .from('work_notes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating work note:', error);
    throw error;
  }

  return data as WorkNote;
}

/**
 * Delete a work note
 */
export async function deleteNote(id: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('work_notes')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error deleting work note:', error);
    throw error;
  }
}
