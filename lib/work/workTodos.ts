// Work todos data layer
import { supabase } from '../supabase/client';
import { applyTokenDelta } from '../tokens';

export interface WorkTodo {
  id: string;
  profile_id: string;
  title: string;
  completed: boolean;
  tokens: number;
  created_at: string;
  completed_at: string | null;
}

/**
 * Fetch all work todos for a profile
 */
export async function fetchWorkTodos(profileId: string): Promise<WorkTodo[]> {
  const { data, error } = await supabase
    .from('work_todos')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching work todos:', error);
    throw error;
  }

  return (data || []) as WorkTodo[];
}

/**
 * Create a new work todo
 */
export async function createWorkTodo(
  profileId: string,
  title: string,
  tokens: number = 1
): Promise<WorkTodo> {
  const { data, error } = await supabase
    .from('work_todos')
    .insert({
      profile_id: profileId,
      title: title.trim(),
      completed: false,
      tokens,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating work todo:', error);
    throw error;
  }

  return data as WorkTodo;
}

/**
 * Toggle work todo completion with token integration
 */
export async function toggleWorkTodoComplete(params: {
  profileId: string;
  id: string;
  completed: boolean;
  title: string;
  tokens: number;
}): Promise<{ todo: WorkTodo; newBalance?: number }> {
  const { profileId, id, completed, title, tokens } = params;

  // Update todo
  const updateData: { completed: boolean; completed_at: string | null } = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  };

  const { data: updatedTodo, error: updateError } = await supabase
    .from('work_todos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error toggling work todo:', updateError);
    throw updateError;
  }

  // Apply token delta
  let newBalance: number | undefined;
  if (tokens > 0) {
    const delta = completed ? tokens : -tokens;
    const type = completed ? 'work_todo_complete' : 'work_todo_uncomplete';

    try {
      const result = await applyTokenDelta({
        profileId,
        delta,
        type,
        sourceTable: 'work_todos',
        sourceId: id,
        meta: {
          title,
          tokens,
        },
      });
      newBalance = result.newBalance;
      // Update token store
      const { tokenStore } = await import('../tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta:', tokenError);
      // Don't throw - todo update succeeded
    }
  }

  return { todo: updatedTodo as WorkTodo, newBalance };
}

/**
 * Delete a work todo
 */
export async function deleteWorkTodo(id: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('work_todos')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error deleting work todo:', error);
    throw error;
  }
}
