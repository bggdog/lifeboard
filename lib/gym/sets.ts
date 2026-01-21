// Gym sets data layer with token integration
import { supabase } from '../supabase/client';
import { applyTokenDelta } from '../tokens';

export interface GymSet {
  id: string;
  profile_id: string;
  lift_id: string;
  performed_at: string;
  weight: number;
  reps: number;
  notes: string | null;
  tokens: number;
  created_at: string;
}

/**
 * Fetch recent sets for multiple lifts
 */
export async function fetchRecentSetsForLifts(
  profileId: string,
  liftIds: string[],
  limitPerLift: number = 5
): Promise<Record<string, GymSet[]>> {
  if (liftIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('gym_sets')
    .select('*')
    .eq('profile_id', profileId)
    .in('lift_id', liftIds)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching gym sets:', error);
    throw error;
  }

  const allSets = (data || []) as GymSet[];
  
  // Group by lift_id and limit per lift
  const result: Record<string, GymSet[]> = {};
  const counts: Record<string, number> = {};

  for (const set of allSets) {
    if (!result[set.lift_id]) {
      result[set.lift_id] = [];
      counts[set.lift_id] = 0;
    }
    
    if (counts[set.lift_id] < limitPerLift) {
      result[set.lift_id].push(set);
      counts[set.lift_id]++;
    }
  }

  // Ensure all liftIds have an array (even if empty)
  for (const liftId of liftIds) {
    if (!result[liftId]) {
      result[liftId] = [];
    }
  }

  return result;
}

export interface CreateSetParams {
  profileId: string;
  liftId: string;
  weight: number;
  reps: number;
  notes?: string | null;
  tokens?: number;
  performedAt?: string;
}

/**
 * Create a new gym set with token integration
 */
export async function createSet(params: CreateSetParams): Promise<{ set: GymSet; newBalance?: number }> {
  const {
    profileId,
    liftId,
    weight,
    reps,
    notes = null,
    tokens = 1,
    performedAt,
  } = params;

  // Insert the set
  const { data: newSet, error: insertError } = await supabase
    .from('gym_sets')
    .insert({
      profile_id: profileId,
      lift_id: liftId,
      weight,
      reps,
      notes: notes?.trim() || null,
      tokens,
      performed_at: performedAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating gym set:', insertError);
    throw insertError;
  }

  // Apply token delta
  let newBalance: number | undefined;
  if (tokens > 0) {
    try {
      const result = await applyTokenDelta({
        profileId,
        delta: tokens,
        type: 'gym_set_log',
        sourceTable: 'gym_sets',
        sourceId: newSet.id,
        meta: {
          liftId,
          weight,
          reps,
          notes: notes || null,
        },
      });
      newBalance = result.newBalance;
      // Update token store
      const { tokenStore } = await import('../tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta:', tokenError);
      // Don't throw - set creation succeeded
    }
  }

  return { set: newSet as GymSet, newBalance };
}

export interface DeleteSetParams {
  profileId: string;
  setId: string;
  tokens: number;
  liftId: string;
  weight: number;
  reps: number;
}

/**
 * Delete a gym set and reverse tokens
 */
export async function deleteSet(params: DeleteSetParams): Promise<{ newBalance?: number }> {
  const { profileId, setId, tokens, liftId, weight, reps } = params;

  // Delete the set
  const { error: deleteError } = await supabase
    .from('gym_sets')
    .delete()
    .eq('id', setId)
    .eq('profile_id', profileId);

  if (deleteError) {
    console.error('Error deleting gym set:', deleteError);
    throw deleteError;
  }

  // Reverse token delta
  let newBalance: number | undefined;
  if (tokens > 0) {
    try {
      const result = await applyTokenDelta({
        profileId,
        delta: -tokens,
        type: 'gym_set_delete',
        sourceTable: 'gym_sets',
        sourceId: setId,
        meta: {
          liftId,
          weight,
          reps,
        },
      });
      newBalance = result.newBalance;
      // Update token store
      const { tokenStore } = await import('../tokenStore');
      tokenStore.setBalance(result.newBalance);
    } catch (tokenError) {
      console.error('Error applying token delta:', tokenError);
      // Don't throw - set deletion succeeded
    }
  }

  return { newBalance };
}
