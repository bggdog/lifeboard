// Activity logging and fetching
import { supabase } from './supabase/client';

export interface ActivityEvent {
  id: string;
  profile_id: string;
  type: string;
  source_table: string;
  source_id: string;
  delta: number;
  created_at: string;
  meta: Record<string, any> | null;
}

/**
 * Fetch recent activity events for a profile
 */
export async function fetchRecentActivity(
  profileId: string,
  limit: number = 20
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }

  return (data || []) as ActivityEvent[];
}

/**
 * Format activity event for display
 */
export function formatActivityEvent(event: ActivityEvent): string {
  const { type, delta, meta } = event;
  const title = meta?.title || 'Task';
  const tokens = Math.abs(delta);

  if (type === 'todo_complete') {
    return `+${tokens} Tokens — Completed: ${title}`;
  } else if (type === 'todo_uncomplete') {
    return `-${tokens} Tokens — Uncompleted: ${title}`;
  }

  // Generic fallback
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}${tokens} Tokens — ${type}`;
}
