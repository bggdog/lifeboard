// Passive life area decay system
import { supabase } from './supabase/client';
import { fetchLifeAreas } from './lifeAreas';
import { fetchHabits } from './habits';
import { fetchHabitCompletions } from './habitCompletions';
import { fetchWorkTodos } from './work/workTodos';
import { fetchLifeAreaScores, upsertLifeAreaScore } from './lifeAreaScores';
import { recomputeAllLifeAreas } from './recompute';
import { getDateStringDaysAgo, getTodayDateString } from './streaks';

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
 * Get week start (Monday) for a given date
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return getLocalDateString(d);
}

/**
 * Check if there were actions in a life area on a specific date
 */
async function hadActionsInArea(
  profileId: string,
  lifeAreaId: string,
  lifeAreaName: string,
  dateString: string
): Promise<boolean> {
  // Get all habits assigned to this life area
  const allHabits = await fetchHabits(profileId);
  const habitsInArea = allHabits.filter(
    (h) => (h as any).life_area_id === lifeAreaId
  );

  // Check if any habit was completed on this date
  if (habitsInArea.length > 0) {
    const habitIds = habitsInArea.map((h) => h.id);
    const completions = await fetchHabitCompletions(
      profileId,
      habitIds,
      dateString,
      dateString
    );

    // Check if any habit has a completion for this date
    for (const habitId of habitIds) {
      if (completions[habitId]?.has(dateString)) {
        return true;
      }
    }
  }

  // For Professional area, also check work todos
  if (lifeAreaName === 'Professional') {
    const workTodos = await fetchWorkTodos(profileId);
    const targetDate = new Date(dateString);
    
    for (const todo of workTodos) {
      if (todo.completed && todo.completed_at) {
        const completedDate = new Date(todo.completed_at);
        const completedDateString = getLocalDateString(completedDate);
        if (completedDateString === dateString) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if there were actions for 3 consecutive days ending yesterday
 */
async function hadNoActionsFor3Days(
  profileId: string,
  lifeAreaId: string,
  lifeAreaName: string,
  yesterdayString: string
): Promise<boolean> {
  const yesterday = new Date(yesterdayString);
  
  // Check last 3 days (yesterday, day before, day before that)
  for (let i = 0; i < 3; i++) {
    const checkDate = new Date(yesterday);
    checkDate.setDate(yesterday.getDate() - i);
    const checkDateString = getLocalDateString(checkDate);
    
    const hadActions = await hadActionsInArea(
      profileId,
      lifeAreaId,
      lifeAreaName,
      checkDateString
    );
    
    if (hadActions) {
      return false; // Found actions, so not 3 consecutive days without
    }
  }
  
  return true; // No actions for 3 consecutive days
}

/**
 * Get or create grace day for current week
 */
async function getOrCreateGraceDay(
  profileId: string,
  weekStart: string
): Promise<{ id: string; used_on: string | null }> {
  // Check if grace day exists for this week
  const { data: existing, error: fetchError } = await supabase
    .from('grace_days')
    .select('*')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching grace day:', fetchError);
    throw fetchError;
  }

  if (existing) {
    return { id: existing.id, used_on: existing.used_on };
  }

  // Create new grace day for this week
  const { data: newGraceDay, error: insertError } = await supabase
    .from('grace_days')
    .insert({
      profile_id: profileId,
      week_start: weekStart,
      used_on: null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating grace day:', insertError);
    throw insertError;
  }

  return { id: newGraceDay.id, used_on: null };
}

/**
 * Use a grace day for a specific date
 */
async function useGraceDay(
  graceDayId: string,
  dateString: string
): Promise<void> {
  const { error } = await supabase
    .from('grace_days')
    .update({ used_on: dateString })
    .eq('id', graceDayId);

  if (error) {
    console.error('Error using grace day:', error);
    throw error;
  }
}

/**
 * Get last decay run date from profile meta
 */
async function getLastDecayRun(profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('meta')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return (data?.meta as any)?.last_decay_run || null;
}

/**
 * Set last decay run date in profile meta
 */
async function setLastDecayRun(profileId: string, dateString: string): Promise<void> {
  // Fetch current meta
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('meta')
    .eq('id', profileId)
    .single();

  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    throw fetchError;
  }

  const currentMeta = (profile?.meta as any) || {};
  const updatedMeta = {
    ...currentMeta,
    last_decay_run: dateString,
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ meta: updatedMeta })
    .eq('id', profileId);

  if (updateError) {
    console.error('Error updating profile meta:', updateError);
    throw updateError;
  }
}

/**
 * Calculate status from score
 */
function calculateStatus(score: number): string {
  if (score >= 85) {
    return 'Excellent';
  } else if (score >= 70) {
    return 'Good';
  } else if (score >= 50) {
    return 'Okay';
  } else {
    return 'At Risk';
  }
}

/**
 * Apply passive decay to all life areas
 * Runs once per day (guarded by last_decay_run)
 */
export async function applyPassiveDecay(profileId: string): Promise<void> {
  const today = getLocalDateString();
  const yesterday = getDateStringDaysAgo(1);
  const weekStart = getWeekStart(new Date());

  // Check if decay was already run today
  const lastRun = await getLastDecayRun(profileId);
  if (lastRun === today) {
    return; // Already run today
  }

  // Fetch all life areas
  const lifeAreas = await fetchLifeAreas(profileId);
  if (lifeAreas.length === 0) {
    await setLastDecayRun(profileId, today);
    return; // No life areas to decay
  }

  // Fetch current scores
  const currentScores = await fetchLifeAreaScores(profileId);

  // Get or create grace day for this week
  const graceDay = await getOrCreateGraceDay(profileId, weekStart);

  // Process each life area
  for (const area of lifeAreas) {
    const currentScore = currentScores[area.id]?.score || 50; // Default to 50 if no score
    let decayAmount = 0;

    // Check if there were actions yesterday
    const hadActionsYesterday = await hadActionsInArea(
      profileId,
      area.id,
      area.name,
      yesterday
    );

    if (!hadActionsYesterday) {
      // Check if grace day is available and unused
      if (graceDay.used_on === null) {
        // Use grace day to skip decay
        await useGraceDay(graceDay.id, yesterday);
        continue; // Skip decay for this area today
      }

      // Apply base decay: -2
      decayAmount = -2;

      // Check if no actions for 3 consecutive days
      const noActionsFor3Days = await hadNoActionsFor3Days(
        profileId,
        area.id,
        area.name,
        yesterday
      );

      if (noActionsFor3Days) {
        // Apply extra -3 (total -5)
        decayAmount = -5;
      }

      // Cap decay at -5 per day
      decayAmount = Math.max(decayAmount, -5);
    }

    // Apply decay if needed
    if (decayAmount < 0) {
      const newScore = Math.max(0, Math.min(100, currentScore + decayAmount));
      const newStatus = calculateStatus(newScore);

      // Update score
      await upsertLifeAreaScore(
        profileId,
        area.id,
        newScore,
        newStatus,
        {
          ...(currentScores[area.id]?.meta || {}),
          last_decay: {
            date: yesterday,
            amount: decayAmount,
            previous_score: currentScore,
          },
        }
      );
    }
  }

  // Mark decay as run for today
  await setLastDecayRun(profileId, today);
}
