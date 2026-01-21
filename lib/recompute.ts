// Recompute pipeline for life area scores
import { fetchLifeAreas, createDefaultLifeAreas } from './lifeAreas';
import { fetchHabits } from './habits';
import { fetchHabitCompletions } from './habitCompletions';
import { computeAreaScore } from './areaScoring';
import { upsertLifeAreaScore } from './lifeAreaScores';
import { getDateStringDaysAgo, getTodayDateString } from './streaks';

/**
 * Recompute all life area scores for a profile
 */
export async function recomputeAllLifeAreas(profileId: string): Promise<void> {
  // Step 1: Ensure default life areas exist
  await createDefaultLifeAreas(profileId);

  // Step 2: Fetch all life areas
  const lifeAreas = await fetchLifeAreas(profileId);

  if (lifeAreas.length === 0) {
    return; // No life areas to compute
  }

  // Step 3: Fetch all active habits
  const allHabits = await fetchHabits(profileId);

  // Step 4: Group habits by life_area_id
  const habitsByArea: Record<string, typeof allHabits> = {};
  const habitsWithoutArea: typeof allHabits = [];

  allHabits.forEach((habit) => {
    const areaId = (habit as any).life_area_id;
    if (areaId) {
      if (!habitsByArea[areaId]) {
        habitsByArea[areaId] = [];
      }
      habitsByArea[areaId].push(habit);
    } else {
      habitsWithoutArea.push(habit);
    }
  });

  // Step 5: Fetch completions for last 14 days for all habits
  const daysWindow = 14;
  const fromDate = getDateStringDaysAgo(daysWindow - 1); // Last 14 days including today
  const toDate = getTodayDateString();

  // Get all habit IDs
  const allHabitIds = allHabits.map((h) => h.id);

  // Fetch completions for all habits at once
  const completionsByHabit: Record<string, Set<string>> = {};

  if (allHabitIds.length > 0) {
    // Fetch completions for all habits at once
    const allCompletions = await fetchHabitCompletions(
      profileId,
      allHabitIds,
      fromDate,
      toDate
    );

    // Copy to completionsByHabit
    Object.keys(allCompletions).forEach((habitId) => {
      completionsByHabit[habitId] = allCompletions[habitId];
    });
  }

  // Step 6: Compute score for each life area
  const scorePromises = lifeAreas.map(async (area) => {
    const habitsInArea = habitsByArea[area.id] || [];

    // Build completions map for this area's habits
    const areaCompletions: Record<string, Set<string>> = {};
    habitsInArea.forEach((habit) => {
      areaCompletions[habit.id] = completionsByHabit[habit.id] || new Set();
    });

    // Compute score
    const result = computeAreaScore({
      daysWindow,
      habitsInArea,
      completionsByHabit: areaCompletions,
    });

    // Upsert score
    await upsertLifeAreaScore(
      profileId,
      area.id,
      result.score,
      result.status,
      result.meta
    );
  });

  await Promise.all(scorePromises);
}
