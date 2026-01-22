// Authentication helpers for Supabase
import { supabase } from './supabase/client';

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  return {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    error: null,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  return {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    error: null,
  };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email } : null;
}

/**
 * Get current session (checks if user is logged in)
 */
export async function getSession(): Promise<{ user: AuthUser | null; session: any }> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { user: null, session: null };
  }

  return {
    user: session.user ? { id: session.user.id, email: session.user.email } : null,
    session,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession();
  return !!session;
}
