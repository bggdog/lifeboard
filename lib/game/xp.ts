// XP and Level calculation utilities

/**
 * Calculate XP awarded for an activity event
 */
export function xpForEvent(type: string, tokenDelta: number): number {
  // Base XP for any action
  let xp = 5;

  // If earning tokens, add bonus XP
  if (tokenDelta > 0) {
    xp += tokenDelta * 2;
  }

  // No XP for reversals (tokenDelta < 0)
  if (tokenDelta < 0) {
    return 0;
  }

  return xp;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
}

/**
 * Calculate level from total XP
 * Level curve: level 1 starts at 0, each level needs 100 + (level-1)*25 more XP
 */
export function levelFromXp(xp: number): LevelInfo {
  if (xp < 0) xp = 0;

  let level = 1;
  let xpNeeded = 0;
  let totalXpForLevel = 0;

  // Calculate level by subtracting thresholds
  while (xp >= totalXpForLevel) {
    // XP needed for next level = 100 + (level-1)*25
    xpNeeded = 100 + (level - 1) * 25;
    totalXpForLevel += xpNeeded;
    
    if (xp >= totalXpForLevel) {
      level++;
    }
  }

  // Calculate XP into current level
  let xpIntoLevel = xp;
  let previousThreshold = 0;
  for (let l = 1; l < level; l++) {
    previousThreshold += 100 + (l - 1) * 25;
  }
  xpIntoLevel = xp - previousThreshold;

  // XP needed for next level
  const xpForNext = xpNeeded - xpIntoLevel;

  return {
    level,
    xpIntoLevel,
    xpForNext,
  };
}
