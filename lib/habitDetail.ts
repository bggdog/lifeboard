// Habit detail data layer
import { supabase } from './supabase/client';
import { applyTokenDelta } from './tokens';
import type { Habit } from './habits';

/**
 * Fetch a single habit by ID
 */
export async function fetchHabit(
  profileId: string,
  habitId: string
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('profile_id', profileId)
    .single();

  if (error) {
    console.error('Error fetching habit:', error);
    throw error;
  }

  return data as Habit;
}

/**
 * Fetch completions for a specific month
 * Returns a Set of date strings (YYYY-MM-DD) that are completed
 */
export async function fetchMonthCompletions(
  profileId: string,
  habitId: string,
  year: number,
  month: number
): Promise<Set<string>> {
  // Get first and last day of month
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

  const { data, error } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('profile_id', profileId)
    .eq('habit_id', habitId)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .eq('completed', true);

  if (error) {
    console.error('Error fetching month completions:', error);
    throw error;
  }

  const completedDates = new Set<string>();
  (data || []).forEach((completion: { date: string }) => {
    completedDates.add(completion.date);
  });

  return completedDates;
}

/**
 * Fetch completions for a date range
 */
export async function fetchRangeCompletions(
  profileId: string,
  habitId: string,
  fromDate: string,
  toDate: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('profile_id', profileId)
    .eq('habit_id', habitId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .eq('completed', true);

  if (error) {
    console.error('Error fetching range completions:', error);
    throw error;
  }

  const completedDates = new Set<string>();
  (data || []).forEach((completion: { date: string }) => {
    completedDates.add(completion.date);
  });

  return completedDates;
}

/**
 * Toggle habit completion for a specific date
 */
export async function toggleHabitOnDate(params: {
  profileId: string;
  habitId: string;
  dateString: string;
  title: string;
  tokens: number;
}): Promise<{ completed: boolean; newBalance?: number }> {
  const { profileId, habitId, dateString, title, tokens } = params;

  // Check if completion exists for this date
  const { data: existingCompletion, error: fetchError } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('habit_id', habitId)
    .eq('date', dateString)
    .single();

  let completed: boolean;
  let newBalance: number | undefined;

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
          date: dateString,
        },
      });
      newBalance = result.newBalance;
      // Update token store
      const { tokenStore } = await import('./tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta on uncomplete:', tokenError);
      // Don't throw - completion deletion succeeded
    }
  } else {
    // No completion exists - create it (complete)
    const { error: insertError } = await supabase
      .from('habit_completions')
      .insert({
        profile_id: profileId,
        habit_id: habitId,
        date: dateString,
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
          date: dateString,
        },
      });
      newBalance = result.newBalance;
      // Update token store
      const { tokenStore } = await import('./tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta on complete:', tokenError);
      // Don't throw - completion creation succeeded
    }
  }

  return { completed, newBalance };
}
