// Real-time subscription utilities for Supabase
import { supabase } from './supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to changes in a table for a specific profile
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToTable<T>(
  table: string,
  profileId: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: T; old?: T }) => void
): () => void {
  const channelName = `${table}-${profileId}-${Date.now()}`;
  console.log(`[Realtime] Subscribing to ${table} for profile ${profileId}`);
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `profile_id=eq.${profileId}`,
      },
      (payload) => {
        console.log(`[Realtime] Received ${payload.eventType} event for ${table}:`, payload);
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        });
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] Channel ${channelName} status:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Successfully subscribed to ${table} for profile ${profileId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to ${table}:`, channel);
      }
    });

  // Return cleanup function
  return () => {
    console.log(`[Realtime] Unsubscribing from ${table} for profile ${profileId}`);
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to profile changes (for token balance, XP, level)
 */
export function subscribeToProfile(
  profileId: string,
  callback: (payload: { token_balance?: number; xp?: number; level?: number }) => void
): () => void {
  const channel = supabase
    .channel(`profile-${profileId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profileId}`,
      },
      (payload) => {
        const newData = payload.new as { token_balance?: number; xp?: number; level?: number };
        callback({
          token_balance: newData.token_balance,
          xp: newData.xp,
          level: newData.level,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
