// Profile helper - creates anonymous profile if none exists
import { supabase } from './supabase/client';

export interface Profile {
  id: string;
  token_balance: number;
  xp?: number;
  level?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a profile for the current session
 * Creates an anonymous profile if user is not authenticated
 * Uses device/session ID to track profiles
 */
export async function getOrCreateProfile(): Promise<Profile> {
  // Get current session (anon or authenticated)
  const { data: { session } } = await supabase.auth.getSession();
  
  // Use session user ID if authenticated, otherwise use anonymous ID
  const profileId = session?.user?.id || `anon_${getSessionId()}`;
  
  // Try to fetch existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  
  // If profile exists, return it
  if (existingProfile && !fetchError) {
    return existingProfile as Profile;
  }
  
  // If fetch error is "not found" (PGRST116), create new profile
  // Otherwise, log the error but still try to create
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.warn('Error fetching profile (will try to create):', fetchError);
  }
  
  // Create new profile if it doesn't exist
  const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
    id: profileId,
    token_balance: 0,
    xp: 0,
    level: 1,
  };
  
  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert(newProfile)
    .select()
    .single();
  
  if (createError) {
    // If insert fails (e.g., table doesn't exist yet), return a default profile
    console.warn('Could not create profile:', createError);
    const now = new Date().toISOString();
    return {
      id: profileId,
      token_balance: 0,
      created_at: now,
      updated_at: now,
    };
  }
  
  return createdProfile;
}

/**
 * Get a persistent session ID from localStorage
 * Falls back to generating a new one if not found
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return `session_${Date.now()}`;
  
  let sessionId = localStorage.getItem('lifeos_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('lifeos_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get current token balance from profile
 */
export async function getTokenBalance(): Promise<number> {
  const profile = await getOrCreateProfile();
  return profile.token_balance || 0;
}
