// Todo data layer for Supabase
import { supabase } from './supabase/client';
import { applyTokenDelta } from './tokens';

export interface Todo {
  id: string;
  profile_id: string;
  title: string;
  completed: boolean;
  tokens: number;
  created_at: string;
  completed_at: string | null;
}

/**
 * Fetch all todos for a profile
 */
export async function fetchTodos(profileId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }

  return (data || []) as Todo[];
}

/**
 * Create a new todo
 */
export async function createTodo(
  profileId: string,
  title: string,
  tokens: number = 1
): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({
      profile_id: profileId,
      title: title.trim(),
      tokens,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating todo:', error);
    throw error;
  }

  return data as Todo;
}

/**
 * Toggle todo completion status with token integration
 */
export async function toggleTodoComplete(
  id: string,
  completed: boolean,
  options?: {
    profileId?: string;
    tokens?: number;
    title?: string;
  }
): Promise<{ todo: Todo; newBalance?: number }> {
  // First, get the todo to check current state and get tokens/title
  const { data: existingTodo, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching todo:', fetchError);
    throw fetchError;
  }

  const todo = existingTodo as Todo;

  // Update todo completion status
  const updateData: { completed: boolean; completed_at: string | null } = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  };

  const { data: updatedTodo, error: updateError } = await supabase
    .from('todos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error toggling todo:', updateError);
    throw updateError;
  }

  // Apply token delta if profileId and tokens are provided
  let newBalance: number | undefined;
  if (options?.profileId && todo.tokens > 0) {
    const tokens = options.tokens ?? todo.tokens;
    const title = options.title ?? todo.title;
    const delta = completed ? tokens : -tokens;
    const type = completed ? 'todo_complete' : 'todo_uncomplete';

    try {
      const result = await applyTokenDelta({
        profileId: options.profileId,
        delta,
        type,
        sourceTable: 'todos',
        sourceId: id,
        meta: {
          title,
          tokens,
        },
      });
      newBalance = result.newBalance;
    } catch (tokenError) {
      console.error('Error applying token delta:', tokenError);
      // Don't throw - todo update succeeded, token update failed
      // This allows the UI to handle the error gracefully
    }
  }

  return { todo: updatedTodo as Todo, newBalance };
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}
