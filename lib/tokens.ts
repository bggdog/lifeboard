// Token engine for managing token balance and activity logging
import { supabase } from './supabase/client';
import { xpForEvent, levelFromXp } from './game/xp';
import { upsertDailyStatsOnEvent, getLocalDateString } from './game/daily';

export interface ApplyTokenDeltaParams {
  profileId: string;
  delta: number;
  type: string;
  sourceTable: string;
  sourceId: string;
  meta?: Record<string, any>;
}

/**
 * Get current token balance for a profile
 */
export async function getTokenBalance(profileId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('token_balance')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }

  return data?.token_balance || 0;
}

/**
 * Apply a token delta and log the activity
 * This performs two operations:
 * 1. Insert activity event (non-blocking - if it fails, we still update balance)
 * 2. Update profile token balance (critical - must succeed)
 */
export async function applyTokenDelta(
  params: ApplyTokenDeltaParams
): Promise<{ newBalance: number; newXp?: number; newLevel?: number }> {
  const { profileId, delta, type, sourceTable, sourceId, meta } = params;

  // Step 1: Try to insert activity event (non-blocking)
  // If this fails, we still want to update the balance
  try {
    const { error: eventError } = await supabase
      .from('activity_events')
      .insert({
        profile_id: profileId,
        type,
        source_table: sourceTable,
        source_id: sourceId,
        delta,
        meta: meta || null,
      });

    if (eventError) {
      console.warn('Error logging activity event (non-blocking):', eventError);
      // Don't throw - continue with balance update
    }
  } catch (eventError) {
    console.warn('Error logging activity event (non-blocking):', eventError);
    // Don't throw - continue with balance update
  }

  // Step 2: Update token balance, XP, and level atomically (critical operation)
  // First get current profile data
  const { data: profileData, error: fetchError } = await supabase
    .from('profiles')
    .select('token_balance, xp, level')
    .eq('id', profileId)
    .single();

  if (fetchError) {
    console.error('Error fetching current profile:', fetchError);
    throw fetchError;
  }

  const currentBalance = profileData?.token_balance ?? 0;
  const currentXp = profileData?.xp ?? 0;
  const currentLevel = profileData?.level ?? 1;
  const newBalance = Math.max(0, currentBalance + delta); // Prevent negative balance

  // Calculate XP delta
  const xpDelta = xpForEvent(type, delta);
  const newXp = currentXp + xpDelta;

  // Calculate new level
  const levelInfo = levelFromXp(newXp);
  const newLevel = levelInfo.level;

  // Prepare update data
  const updateData: { token_balance: number; xp?: number; level?: number } = {
    token_balance: newBalance,
  };

  // Only update XP and level if XP increased
  if (xpDelta > 0) {
    updateData.xp = newXp;
    updateData.level = newLevel;
  }

  // Update profile
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profileId)
    .select('token_balance, xp, level')
    .single();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    console.error('Profile ID:', profileId);
    console.error('Current balance:', currentBalance);
    console.error('Delta:', delta);
    console.error('New balance:', newBalance);
    throw updateError;
  }

  if (!updatedProfile) {
    throw new Error('Profile update returned no data');
  }

  // Step 3: Update daily stats (non-blocking)
  if (xpDelta > 0) {
    try {
      const today = getLocalDateString();
      await upsertDailyStatsOnEvent(profileId, today, delta, xpDelta);
    } catch (dailyError) {
      console.warn('Error updating daily stats (non-blocking):', dailyError);
      // Don't throw - daily stats update is non-critical
    }
  }

  // Step 4: Update activity event meta with XP and level info
  if (xpDelta > 0) {
    const enhancedMeta = {
      ...(meta || {}),
      xpDelta,
      newLevel: newLevel !== currentLevel ? newLevel : undefined,
    };

    // Try to update the activity event we just created
    try {
      // We need to find the most recent event for this profile
      // This is a best-effort update, don't fail if it doesn't work
      const { data: recentEvents } = await supabase
        .from('activity_events')
        .select('id')
        .eq('profile_id', profileId)
        .eq('type', type)
        .eq('source_table', sourceTable)
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentEvents) {
        await supabase
          .from('activity_events')
          .update({ meta: enhancedMeta })
          .eq('id', recentEvents.id);
      }
    } catch (metaError) {
      // Silently fail - meta update is non-critical
      console.warn('Error updating activity event meta:', metaError);
    }
  }

  return { 
    newBalance: updatedProfile.token_balance ?? newBalance,
    ...(xpDelta > 0 ? {
      newXp: updatedProfile.xp ?? newXp,
      newLevel: updatedProfile.level ?? newLevel,
    } : {}),
  };
}
