// Streak and consistency calculation utilities

/**
 * Compute current streak (consecutive days ending today)
 * Returns the number of consecutive completed days ending today (or yesterday if today is incomplete)
 */
export function computeCurrentStreak(
  completedSet: Set<string>,
  todayDateString: string
): number {
  if (completedSet.size === 0) return 0;

  const today = new Date(todayDateString);
  let streak = 0;
  let currentDate = new Date(today);

  // Check if today is completed
  if (completedSet.has(todayDateString)) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    // Start from yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count backwards
  while (true) {
    const dateString = formatDateString(currentDate);
    if (completedSet.has(dateString)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Compute best streak within the completed set
 */
export function computeBestStreak(completedSet: Set<string>): number {
  if (completedSet.size === 0) return 0;

  const sortedDates = Array.from(completedSet)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const daysDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      // Gap in streak
      currentStreak = 1;
    }
  }

  return bestStreak;
}

/**
 * Compute consistency percentage (0-100) for a date range
 */
export function computeConsistency(
  completedSet: Set<string>,
  fromDateString: string,
  toDateString: string
): number {
  const fromDate = new Date(fromDateString);
  const toDate = new Date(toDateString);
  const totalDays =
    Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  if (totalDays <= 0) return 0;

  let completedDays = 0;
  const currentDate = new Date(fromDate);

  while (currentDate <= toDate) {
    const dateString = formatDateString(currentDate);
    if (completedSet.has(dateString)) {
      completedDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.round((completedDays / totalDays) * 100);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date string for N days ago
 */
export function getDateStringDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateString(date);
}

/**
 * Get today's date string
 */
export function getTodayDateString(): string {
  return formatDateString(new Date());
}
