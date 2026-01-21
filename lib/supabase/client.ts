// Singleton Supabase client for client-side usage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uujtatmznjwwuxzjyhfa.supabase.co';
// Support both variable names for flexibility
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
  'sb_publishable_oTFWMsxwP8n_a5RVNoqvzA_WdxqAiub';

// Create singleton client with persistent session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
