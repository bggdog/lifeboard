// Gym metrics utilities
import type { GymSet } from './sets';

/**
 * Estimate 1RM using Epley formula: 1RM = weight * (1 + reps/30)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Format weight as string (e.g., "225" or "135.5")
 */
export function formatWeight(weight: number): string {
  // If it's a whole number, show without decimals
  if (weight % 1 === 0) {
    return weight.toString();
  }
  // Otherwise show one decimal place
  return weight.toFixed(1);
}

export interface LiftSummary {
  lastDate?: string;
  topSet?: {
    weight: number;
    reps: number;
  };
  est1RM?: number;
}

/**
 * Derive lift summary from sets (last date, top set, estimated 1RM)
 */
export function deriveLiftSummary(sets: GymSet[]): LiftSummary {
  if (sets.length === 0) {
    return {};
  }

  // Sort by performed_at descending (most recent first)
  const sortedSets = [...sets].sort(
    (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  );

  const lastDate = sortedSets[0].performed_at;

  // Find top set (highest estimated 1RM)
  let topSet: { weight: number; reps: number } | undefined;
  let max1RM = 0;

  for (const set of sortedSets) {
    const est1RM = estimate1RM(set.weight, set.reps);
    if (est1RM > max1RM) {
      max1RM = est1RM;
      topSet = {
        weight: set.weight,
        reps: set.reps,
      };
    }
  }

  return {
    lastDate,
    topSet,
    est1RM: max1RM > 0 ? max1RM : undefined,
  };
}
