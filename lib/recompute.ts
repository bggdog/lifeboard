// Recompute pipeline for life area scores
import { fetchLifeAreas, createDefaultLifeAreas } from './lifeAreas';
import { fetchHabits } from './habits';
import { fetchHabitCompletions } from './habitCompletions';
import { computeAreaScore } from './areaScoring';
import { upsertLifeAreaScore } from './lifeAreaScores';
import { getDateStringDaysAgo, getTodayDateString } from './streaks';
import { fetchWorkTodos } from './work/workTodos';

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

  // Step 6: For Professional area, also fetch work todos completions
  let professionalAreaId: string | null = null;
  const professionalArea = lifeAreas.find((area) => area.name === 'Professional');
  if (professionalArea) {
    professionalAreaId = professionalArea.id;
  }

  // Fetch work todos for Professional area scoring
  let workTodosCompletions: Record<string, Set<string>> = {};
  if (professionalAreaId) {
    const workTodos = await fetchWorkTodos(profileId);
    const fromDate = getDateStringDaysAgo(daysWindow - 1);
    const toDate = getTodayDateString();

    // Build completions map from work todos (treat each completed todo as a completion)
    workTodos.forEach((todo) => {
      if (todo.completed && todo.completed_at) {
        const completedDate = new Date(todo.completed_at);
        const dateString = formatDateString(completedDate);
        
        // Check if completion is within the window
        if (dateString >= fromDate && dateString <= toDate) {
          if (!workTodosCompletions[todo.id]) {
            workTodosCompletions[todo.id] = new Set();
          }
          workTodosCompletions[todo.id].add(dateString);
        }
      }
    });
  }

  // Step 7: Compute score for each life area
  const scorePromises = lifeAreas.map(async (area) => {
    const habitsInArea = habitsByArea[area.id] || [];

    // Build completions map for this area's habits
    const areaCompletions: Record<string, Set<string>> = {};
    habitsInArea.forEach((habit) => {
      areaCompletions[habit.id] = completionsByHabit[habit.id] || new Set();
    });

    // For Professional area, include work todos as "habits" for scoring
    let habitsForScoring = habitsInArea;
    if (area.id === professionalAreaId && Object.keys(workTodosCompletions).length > 0) {
      // Create virtual "habits" from work todos for scoring purposes
      const workTodos = await fetchWorkTodos(profileId);
      const virtualHabits = workTodos.map((todo) => ({
        id: `work_todo_${todo.id}`,
        profile_id: profileId,
        title: todo.title,
        category: null,
        tokens: todo.tokens,
        created_at: todo.created_at,
        active: true,
        life_area_id: null,
      }));

      habitsForScoring = [...habitsInArea, ...virtualHabits];
      
      // Add work todos completions to area completions
      Object.keys(workTodosCompletions).forEach((todoId) => {
        areaCompletions[`work_todo_${todoId}`] = workTodosCompletions[todoId];
      });
    }

    // Compute score
    const result = computeAreaScore({
      daysWindow,
      habitsInArea: habitsForScoring,
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

/**
 * Format Date to YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
