// Life Area scoring engine (pure functions)
import type { Habit } from './habits';

export interface AreaScoreResult {
  score: number;
  status: string;
  meta: {
    completionRates: Record<string, number>;
    recencyPenalty: number;
    averageCompletionRate: number;
  };
}

/**
 * Compute area score based on habit completions
 */
export function computeAreaScore(params: {
  daysWindow: number;
  habitsInArea: Habit[];
  completionsByHabit: Record<string, Set<string>>;
}): AreaScoreResult {
  const { daysWindow, habitsInArea, completionsByHabit } = params;

  if (habitsInArea.length === 0) {
    return {
      score: 0,
      status: 'At Risk',
      meta: {
        completionRates: {},
        recencyPenalty: 0,
        averageCompletionRate: 0,
      },
    };
  }

  // Step A: Compute completion rate for each habit
  const completionRates: Record<string, number> = {};
  let totalCompletionRate = 0;

  habitsInArea.forEach((habit) => {
    const completions = completionsByHabit[habit.id] || new Set();
    const completedDays = completions.size;
    const completionRate = completedDays / daysWindow;
    completionRates[habit.id] = completionRate;
    totalCompletionRate += completionRate;
  });

  // Step B: Average completion rate (equal weight for all habits)
  const averageCompletionRate = totalCompletionRate / habitsInArea.length;
  let baseScore = averageCompletionRate * 100;

  // Step D: Recency penalty
  // Check if any habit has 0 completions in last 3 days
  const today = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(today.getDate() - 3);

  let recencyPenalty = 0;
  const penaltyPerHabit = 5;
  const maxPenalty = 20;

  habitsInArea.forEach((habit) => {
    const completions = completionsByHabit[habit.id] || new Set();
    let hasRecentCompletion = false;

    // Check last 3 days
    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = formatDateString(checkDate);
      if (completions.has(dateString)) {
        hasRecentCompletion = true;
        break;
      }
    }

    if (!hasRecentCompletion) {
      recencyPenalty += penaltyPerHabit;
    }
  });

  recencyPenalty = Math.min(recencyPenalty, maxPenalty);
  baseScore = Math.max(0, baseScore - recencyPenalty);

  // Step E: Clamp score 0-100
  const score = Math.max(0, Math.min(100, Math.round(baseScore)));

  // Step F: Status mapping
  let status: string;
  if (score >= 85) {
    status = 'Excellent';
  } else if (score >= 70) {
    status = 'Good';
  } else if (score >= 50) {
    status = 'Okay';
  } else {
    status = 'At Risk';
  }

  return {
    score,
    status,
    meta: {
      completionRates,
      recencyPenalty,
      averageCompletionRate,
    },
  };
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
