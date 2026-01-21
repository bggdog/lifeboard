// Habit completions data layer
import { supabase } from './supabase/client';

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
 * Get date string for N days ago
 */
function getDateStringDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch habit completions for a date range
 * Returns a map of habitId -> Set of completed date strings (YYYY-MM-DD)
 * Supports both single habitId (string) or array of habitIds
 */
export async function fetchHabitCompletions(
  profileId: string,
  habitIds: string | string[],
  fromDate: string,
  toDate: string
): Promise<Record<string, Set<string>>> {
  const idsArray = Array.isArray(habitIds) ? habitIds : [habitIds];
  
  if (idsArray.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('habit_completions')
    .select('habit_id, date')
    .eq('profile_id', profileId)
    .in('habit_id', idsArray)
    .gte('date', fromDate)
    .lte('date', toDate)
    .eq('completed', true);

  if (error) {
    console.error('Error fetching habit completions:', error);
    throw error;
  }

  // Build map: habitId -> Set of date strings
  const result: Record<string, Set<string>> = {};
  
  // Initialize sets for all habits
  idsArray.forEach((id) => {
    result[id] = new Set();
  });

  // Populate with actual completions
  (data || []).forEach((completion: { habit_id: string; date: string }) => {
    if (!result[completion.habit_id]) {
      result[completion.habit_id] = new Set();
    }
    result[completion.habit_id].add(completion.date);
  });

  return result;
}

/**
 * Fetch completions for the last 7 days (including today)
 */
export async function fetchLast7DaysCompletions(
  profileId: string,
  habitIds: string[]
): Promise<Record<string, Set<string>>> {
  const today = getTodayDateString();
  const sevenDaysAgo = getDateStringDaysAgo(6); // 6 days ago + today = 7 days

  return fetchHabitCompletions(profileId, habitIds, sevenDaysAgo, today);
}

/**
 * Get array of last 7 days date strings (oldest to newest)
 */
export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(getDateStringDaysAgo(i));
  }
  return days;
}

/**
 * Get today's date string
 */
export function getToday(): string {
  return getTodayDateString();
}
