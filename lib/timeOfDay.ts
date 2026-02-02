// Time of day utilities for calm, time-aware UI

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Get current time of day based on local time
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return 'morning';
  } else if (hour >= 11 && hour < 18) {
    return 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    return 'evening';
  } else {
    return 'night';
  }
}

/**
 * Get time-aware greeting or date string for header
 */
export function getTimeAwareHeader(): string {
  const timeOfDay = getTimeOfDay();
  const now = new Date();
  
  if (timeOfDay === 'morning') {
    return 'Good morning.';
  } else if (timeOfDay === 'evening') {
    return 'Good evening.';
  } else {
    // Afternoon or night: show date
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    const day = now.getDate();
    return `${dayName} · ${monthName} ${day}`;
  }
}

/**
 * Get time-aware tone class for styling
 */
export function getTimeAwareToneClass(): string {
  const timeOfDay = getTimeOfDay();
  
  if (timeOfDay === 'morning') {
    return 'tone-morning';
  } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
    return 'tone-evening';
  } else {
    return 'tone-afternoon';
  }
}

/**
 * Format relative time (e.g., "added today", "edited 2d ago")
 */
export function getRelativeTimeText(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'added today';
  } else if (diffDays === 1) {
    return 'added yesterday';
  } else if (diffDays < 7) {
    return `added ${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `added ${weeks}w ago`;
  } else {
    return 'added earlier';
  }
}
