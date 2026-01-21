// Life Areas data layer
import { supabase } from './supabase/client';

export interface LifeArea {
  id: string;
  profile_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

const DEFAULT_LIFE_AREAS = [
  { name: 'Spiritual', icon: '🙏' },
  { name: 'Fitness', icon: '💪' },
  { name: 'Work', icon: '💼' },
  { name: 'Relationships', icon: '❤️' },
  { name: 'Learning', icon: '📚' },
  { name: 'Health', icon: '🧠' },
];

/**
 * Fetch all life areas for a profile
 */
export async function fetchLifeAreas(profileId: string): Promise<LifeArea[]> {
  const { data, error } = await supabase
    .from('life_areas')
    .select('*')
    .eq('profile_id', profileId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching life areas:', error);
    throw error;
  }

  return (data || []) as LifeArea[];
}

/**
 * Create default life areas if none exist
 */
export async function createDefaultLifeAreas(profileId: string): Promise<void> {
  // Check if any life areas exist
  const { data: existing, error: checkError } = await supabase
    .from('life_areas')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1);

  if (checkError) {
    console.error('Error checking life areas:', checkError);
    throw checkError;
  }

  // If life areas exist, don't create defaults
  if (existing && existing.length > 0) {
    return;
  }

  // Create default life areas
  const areasToInsert = DEFAULT_LIFE_AREAS.map((area) => ({
    profile_id: profileId,
    name: area.name,
    icon: area.icon,
    color: null,
  }));

  const { error: insertError } = await supabase
    .from('life_areas')
    .insert(areasToInsert);

  if (insertError) {
    console.error('Error creating default life areas:', insertError);
    throw insertError;
  }
}

/**
 * Assign a habit to a life area
 */
export async function assignHabitToLifeArea(
  habitId: string,
  lifeAreaId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ life_area_id: lifeAreaId })
    .eq('id', habitId);

  if (error) {
    console.error('Error assigning habit to life area:', error);
    throw error;
  }
}
