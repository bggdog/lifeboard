// Life Area scores persistence layer
import { supabase } from './supabase/client';

export interface LifeAreaScore {
  id: string;
  profile_id: string;
  life_area_id: string;
  score: number;
  status: string;
  updated_at: string;
  meta: Record<string, any> | null;
}

/**
 * Upsert a life area score
 */
export async function upsertLifeAreaScore(
  profileId: string,
  lifeAreaId: string,
  score: number,
  status: string,
  meta?: Record<string, any>
): Promise<void> {
  // Check if score exists
  const { data: existing, error: fetchError } = await supabase
    .from('life_area_scores')
    .select('id')
    .eq('profile_id', profileId)
    .eq('life_area_id', lifeAreaId)
    .maybeSingle();

  const updateData = {
    score,
    status,
    meta: meta || null,
    updated_at: new Date().toISOString(),
  };

  if (existing && !fetchError) {
    // Update existing
    const { error: updateError } = await supabase
      .from('life_area_scores')
      .update(updateData)
      .eq('id', existing.id);

    if (updateError) {
      console.error('Error updating life area score:', updateError);
      throw updateError;
    }
  } else {
    // Insert new (only if it doesn't exist)
    const { error: insertError } = await supabase
      .from('life_area_scores')
      .insert({
        profile_id: profileId,
        life_area_id: lifeAreaId,
        ...updateData,
      });

    if (insertError) {
      // If insert fails due to unique constraint, try update instead
      if (insertError.code === '23505' || insertError.message?.includes('unique')) {
        // Race condition - try update
        const { error: retryUpdateError } = await supabase
          .from('life_area_scores')
          .update(updateData)
          .eq('profile_id', profileId)
          .eq('life_area_id', lifeAreaId);

        if (retryUpdateError) {
          console.error('Error updating life area score (retry):', retryUpdateError);
          throw retryUpdateError;
        }
      } else {
        console.error('Error inserting life area score:', insertError);
        throw insertError;
      }
    }
  }
}

/**
 * Fetch all life area scores for a profile
 * Returns a map of lifeAreaId -> {score, status, updated_at}
 */
export async function fetchLifeAreaScores(
  profileId: string
): Promise<
  Record<
    string,
    { score: number; status: string; updated_at: string; meta: any }
  >
> {
  const { data, error } = await supabase
    .from('life_area_scores')
    .select('*')
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error fetching life area scores:', error);
    throw error;
  }

  const result: Record<
    string,
    { score: number; status: string; updated_at: string; meta: any }
  > = {};

  (data || []).forEach((score: LifeAreaScore) => {
    result[score.life_area_id] = {
      score: score.score,
      status: score.status,
      updated_at: score.updated_at,
      meta: score.meta,
    };
  });

  return result;
}
