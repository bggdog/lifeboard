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
 * Uses authenticated user ID if logged in, otherwise creates anonymous profile
 * Sessions persist automatically via Supabase (no login needed each time)
 */
export async function getOrCreateProfile(): Promise<Profile> {
  // Get current session (authenticated or anonymous)
  let { data: { session } } = await supabase.auth.getSession();
  
  // If no session exists, sign in anonymously to get a consistent user ID
  // This creates a persistent anonymous session that survives app restarts
  if (!session) {
    console.log('[Profile] No session found, signing in anonymously...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('[Profile] Error signing in anonymously:', authError);
      // Fallback to localStorage-based ID if anonymous auth fails
      const profileId = `anon_${getSessionId()}`;
      return await createOrFetchProfile(profileId);
    }
    
    session = authData.session;
    console.log('[Profile] Signed in anonymously, user ID:', session?.user?.id);
  }
  
  // Use session user ID (from authenticated or anonymous auth)
  const profileId = session?.user?.id;
  
  if (!profileId || !session) {
    throw new Error('Could not get user ID from session');
  }
  
  console.log('[Profile] Using profile ID:', profileId, session.user.is_anonymous ? '(anonymous)' : '(authenticated)');
  
  return await createOrFetchProfile(profileId);
}

/**
 * Helper to create or fetch a profile by ID
 */
async function createOrFetchProfile(profileId: string): Promise<Profile> {
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
      xp: 0,
      level: 1,
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
