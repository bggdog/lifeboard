// Client-side only profile helpers
'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';

/**
 * React hook to get token balance
 * Only works on client side
 */
export function useTokenBalance() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch on client side - use setTimeout to avoid blocking initial render
    if (typeof window === 'undefined') return;

    // Delay fetch slightly to ensure page renders first
    const timeoutId = setTimeout(() => {
      async function fetchBalance() {
        try {
          // Get current session (anon or authenticated)
          const { data: { session } } = await supabase.auth.getSession();
          
          // Use session user ID if authenticated, otherwise use anonymous ID
          const profileId = session?.user?.id || `anon_${getSessionId()}`;
          
          // Try to fetch existing profile
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('token_balance')
            .eq('id', profileId)
            .single();
          
          if (existingProfile && !fetchError) {
            setTokenBalance(existingProfile.token_balance || 0);
          } else {
            // If profile doesn't exist, create it (but don't wait for it)
            (async () => {
              try {
                const result = await supabase
                  .from('profiles')
                  .insert({ id: profileId, token_balance: 0 })
                  .select('token_balance')
                  .single();
                if (result.data) {
                  setTokenBalance(result.data.token_balance || 0);
                }
              } catch {
                // Silently fail if table doesn't exist yet
                setTokenBalance(0);
              }
            })();
          }
        } catch (err) {
          // Silently fail - don't block the app
          setTokenBalance(0);
        }
      }

      fetchBalance();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return { tokenBalance, loading };
}

/**
 * Get a persistent session ID from localStorage
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
