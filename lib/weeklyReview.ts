// Weekly review data generation and management
import { supabase } from './supabase/client';
import { fetchLifeAreas } from './lifeAreas';
import { fetchLifeAreaScores } from './lifeAreaScores';
import { getDateStringDaysAgo, getTodayDateString } from './streaks';

export interface WeeklyReviewSummary {
  strongest_area: string;
  weakest_area: string;
  total_actions: number;
  total_tokens: number;
  missed_days_count: number;
  days_met_goal: number;
}

export interface WeeklyReview {
  id: string;
  profile_id: string;
  week_start: string;
  week_end: string;
  strongest_area: string;
  weakest_area: string;
  total_actions: number;
  total_tokens: number;
  reflection: string | null;
  completed: boolean;
  created_at: string;
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get week range (Monday to Sunday) for a given date
 * Returns the Monday and Sunday of the week containing the date
 */
export function getWeekRange(date?: Date): { weekStart: string; weekEnd: string } {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(d);
  monday.setDate(diff);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: getLocalDateString(monday),
    weekEnd: getLocalDateString(sunday),
  };
}

/**
 * Generate weekly review summary for a given week
 */
export async function generateWeeklyReview(
  profileId: string,
  weekStart: string
): Promise<WeeklyReviewSummary> {
  const { weekEnd } = getWeekRange(new Date(weekStart));

  // Fetch daily stats for the week
  const { data: dailyStats, error: statsError } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('profile_id', profileId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true });

  if (statsError) {
    console.error('Error fetching daily stats:', statsError);
    throw statsError;
  }

  // Calculate totals
  let totalActions = 0;
  let totalTokens = 0;
  let daysMetGoal = 0;
  let missedDaysCount = 0;

  // Generate all dates in the week
  const weekDates: string[] = [];
  const startDate = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(getLocalDateString(date));
  }

  // Process each day
  weekDates.forEach((date) => {
    const dayStats = dailyStats?.find((s) => s.date === date);
    if (dayStats) {
      totalActions += dayStats.actions_completed || 0;
      totalTokens += dayStats.tokens_earned || 0;
      if (dayStats.actions_completed >= 3) {
        daysMetGoal++;
      }
    } else {
      missedDaysCount++;
    }
  });

  // Find strongest and weakest life areas
  const lifeAreas = await fetchLifeAreas(profileId);
  const scores = await fetchLifeAreaScores(profileId);

  let strongestArea = 'None';
  let weakestArea = 'None';
  let highestScore = -1;
  let lowestScore = 101;

  for (const area of lifeAreas) {
    const score = scores[area.id]?.score || 0;
    if (score > highestScore) {
      highestScore = score;
      strongestArea = area.name;
    }
    if (score < lowestScore) {
      lowestScore = score;
      weakestArea = area.name;
    }
  }

  // If no scores exist, use first area as default
  if (highestScore === -1 && lifeAreas.length > 0) {
    strongestArea = lifeAreas[0].name;
    weakestArea = lifeAreas[0].name;
  }

  return {
    strongest_area: strongestArea,
    weakest_area: weakestArea,
    total_actions: totalActions,
    total_tokens: totalTokens,
    missed_days_count: missedDaysCount,
    days_met_goal: daysMetGoal,
  };
}

/**
 * Save weekly review
 */
export async function saveWeeklyReview(
  profileId: string,
  weekStart: string,
  data: WeeklyReviewSummary & { reflection?: string }
): Promise<WeeklyReview> {
  const { weekEnd } = getWeekRange(new Date(weekStart));

  // Check if review already exists
  const { data: existing, error: fetchError } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching weekly review:', fetchError);
    throw fetchError;
  }

  const reviewData = {
    profile_id: profileId,
    week_start: weekStart,
    week_end: weekEnd,
    strongest_area: data.strongest_area,
    weakest_area: data.weakest_area,
    total_actions: data.total_actions,
    total_tokens: data.total_tokens,
    reflection: data.reflection || null,
    completed: false,
  };

  if (existing) {
    // Update existing review
    const { data: updated, error: updateError } = await supabase
      .from('weekly_reviews')
      .update(reviewData)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating weekly review:', updateError);
      throw updateError;
    }

    return updated as WeeklyReview;
  } else {
    // Create new review
    const { data: created, error: insertError } = await supabase
      .from('weekly_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating weekly review:', insertError);
      throw insertError;
    }

    return created as WeeklyReview;
  }
}

/**
 * Fetch weekly review for a given week
 */
export async function fetchWeeklyReview(
  profileId: string,
  weekStart: string
): Promise<WeeklyReview | null> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching weekly review:', error);
    throw error;
  }

  return (data as WeeklyReview) || null;
}

/**
 * Mark weekly review as completed
 */
export async function completeWeeklyReview(
  profileId: string,
  weekStart: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_reviews')
    .update({ completed: true })
    .eq('profile_id', profileId)
    .eq('week_start', weekStart);

  if (error) {
    console.error('Error completing weekly review:', error);
    throw error;
  }
}

/**
 * Get last week's review (if incomplete)
 */
export async function getLastWeekIncompleteReview(
  profileId: string
): Promise<WeeklyReview | null> {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const { weekStart } = getWeekRange(lastWeek);

  const review = await fetchWeeklyReview(profileId, weekStart);
  if (review && !review.completed) {
    return review;
  }

  return null;
}
