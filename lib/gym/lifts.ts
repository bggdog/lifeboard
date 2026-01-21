// Gym lifts data layer
import { supabase } from '../supabase/client';

export interface Lift {
  id: string;
  profile_id: string;
  name: string;
  category: string | null;
  created_at: string;
  active: boolean;
}

/**
 * Fetch all active lifts for a profile
 */
export async function fetchLifts(profileId: string): Promise<Lift[]> {
  const { data, error } = await supabase
    .from('gym_lifts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching lifts:', error);
    throw error;
  }

  return (data || []) as Lift[];
}

/**
 * Create a new lift
 */
export async function createLift(
  profileId: string,
  name: string,
  category: string | null = null
): Promise<Lift> {
  const { data, error } = await supabase
    .from('gym_lifts')
    .insert({
      profile_id: profileId,
      name: name.trim(),
      category: category?.trim() || null,
      active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lift:', error);
    throw error;
  }

  return data as Lift;
}

/**
 * Toggle lift active status
 */
export async function toggleLiftActive(
  id: string,
  active: boolean,
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from('gym_lifts')
    .update({ active })
    .eq('id', id)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error toggling lift active status:', error);
    throw error;
  }
}
