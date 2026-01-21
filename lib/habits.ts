// Habits data layer for Supabase
import { supabase } from './supabase/client';
import { applyTokenDelta } from './tokens';

export interface Habit {
  id: string;
  profile_id: string;
  title: string;
  category: string | null;
  tokens: number;
  created_at: string;
  active: boolean;
  life_area_id?: string | null;
}

/**
 * Fetch all active habits for a profile
 */
export async function fetchHabits(profileId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('profile_id', profileId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }

  return (data || []) as Habit[];
}

/**
 * Create a new habit
 */
export async function createHabit(
  profileId: string,
  title: string,
  category: string | null = null,
  tokens: number = 1,
  lifeAreaId: string | null = null
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      profile_id: profileId,
      title: title.trim(),
      category: category?.trim() || null,
      tokens,
      active: true,
      life_area_id: lifeAreaId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating habit:', error);
    throw error;
  }

  return data as Habit;
}

/**
 * Delete a habit (soft delete by setting active=false)
 */
export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ active: false })
    .eq('id', habitId);

  if (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

/**
 * Get today's date string in local timezone (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Toggle habit completion for today
 */
export async function toggleHabitForToday(params: {
  profileId: string;
  habitId: string;
  title: string;
  tokens: number;
}): Promise<{ completed: boolean }> {
  const { profileId, habitId, title, tokens } = params;
  const today = getTodayDateString();

  // Check if completion exists for today
  const { data: existingCompletion, error: fetchError } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('habit_id', habitId)
    .eq('date', today)
    .single();

  let completed: boolean;

  if (existingCompletion && !fetchError) {
    // Completion exists - delete it (uncomplete)
    const { error: deleteError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('id', existingCompletion.id);

    if (deleteError) {
      console.error('Error deleting habit completion:', deleteError);
      throw deleteError;
    }

    completed = false;

    // Apply token reversal
    try {
      const result = await applyTokenDelta({
        profileId,
        delta: -tokens,
        type: 'habit_uncomplete',
        sourceTable: 'habits',
        sourceId: habitId,
        meta: {
          title,
          tokens,
          date: today,
        },
      });
      // Update token store with new balance
      const { tokenStore } = await import('./tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta on uncomplete:', tokenError);
      // Don't throw - completion deletion succeeded, token update failed
      // The UI will handle the error and refresh balance
    }
  } else {
    // No completion exists - create it (complete)
    const { error: insertError } = await supabase
      .from('habit_completions')
      .insert({
        profile_id: profileId,
        habit_id: habitId,
        date: today,
        completed: true,
      });

    if (insertError) {
      console.error('Error creating habit completion:', insertError);
      throw insertError;
    }

    completed = true;

    // Apply token award
    try {
      const result = await applyTokenDelta({
        profileId,
        delta: tokens,
        type: 'habit_complete',
        sourceTable: 'habits',
        sourceId: habitId,
        meta: {
          title,
          tokens,
          date: today,
        },
      });
      // Update token store with new balance
      const { tokenStore } = await import('./tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta on complete:', tokenError);
      // Don't throw - completion creation succeeded, token update failed
      // The UI will handle the error and refresh balance
    }
  }

  return { completed };
}
