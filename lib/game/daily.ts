// Daily stats and streak tracking
import { supabase } from '../supabase/client';
import { xpForEvent } from './xp';

export interface DailyStats {
  id: string;
  profile_id: string;
  date: string;
  actions_completed: number;
  tokens_earned: number;
  xp_earned: number;
  streak: number;
  updated_at: string;
}

/**
 * Get local date string in YYYY-MM-DD format
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Upsert daily stats when an event occurs
 */
export async function upsertDailyStatsOnEvent(
  profileId: string,
  dateString: string,
  tokenDelta: number,
  xpDelta: number
): Promise<void> {
  // Only count positive actions
  const isPositiveAction = tokenDelta > 0 || xpDelta > 0;

  if (!isPositiveAction) {
    return; // Don't update stats for reversals
  }

  // Fetch or create today's stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('profile_id', profileId)
    .eq('date', dateString)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine
    console.error('Error fetching daily stats:', fetchError);
    throw fetchError;
  }

  if (existingStats) {
    // Update existing stats
    const { error: updateError } = await supabase
      .from('daily_stats')
      .update({
        actions_completed: existingStats.actions_completed + 1,
        tokens_earned: existingStats.tokens_earned + Math.max(tokenDelta, 0),
        xp_earned: existingStats.xp_earned + xpDelta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingStats.id);

    if (updateError) {
      console.error('Error updating daily stats:', updateError);
      throw updateError;
    }
  } else {
    // Create new stats row
    const { error: insertError } = await supabase
      .from('daily_stats')
      .insert({
        profile_id: profileId,
        date: dateString,
        actions_completed: 1,
        tokens_earned: Math.max(tokenDelta, 0),
        xp_earned: xpDelta,
        streak: 0, // Will be calculated by updateStreak
      });

    if (insertError) {
      console.error('Error inserting daily stats:', insertError);
      throw insertError;
    }
  }

  // Update streak after updating stats
  await updateStreak(profileId, dateString);
}

/**
 * Update streak based on daily goal (3 actions/day)
 */
export async function updateStreak(profileId: string, dateString: string): Promise<void> {
  // Fetch last 14 days of stats
  const { data: stats, error: fetchError } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('profile_id', profileId)
    .gte('date', getDate14DaysAgo())
    .lte('date', dateString)
    .order('date', { ascending: true });

  if (fetchError) {
    console.error('Error fetching stats for streak:', fetchError);
    throw fetchError;
  }

  // Calculate streak: consecutive days with >= 3 actions, ending today
  let streak = 0;
  const today = new Date(dateString);
  
  // Work backwards from today
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const dayStats = stats?.find((s) => s.date === dateStr);
    
    if (dayStats && dayStats.actions_completed >= 3) {
      streak++;
    } else {
      // Streak broken
      break;
    }
  }

  // Update today's streak
  const { error: updateError } = await supabase
    .from('daily_stats')
    .update({ streak })
    .eq('profile_id', profileId)
    .eq('date', dateString);

  if (updateError) {
    console.error('Error updating streak:', updateError);
    // Don't throw - streak update is non-critical
  }
}

/**
 * Get date string for 14 days ago
 */
function getDate14DaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date.toISOString().split('T')[0];
}

/**
 * Fetch today's daily stats
 */
export async function fetchTodayStats(profileId: string): Promise<DailyStats | null> {
  const today = getLocalDateString();
  
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('profile_id', profileId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching today stats:', error);
    throw error;
  }

  return (data as DailyStats) || null;
}
