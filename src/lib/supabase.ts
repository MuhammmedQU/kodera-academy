import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from './env';

let browserClient: SupabaseClient | null = null;

/**
 * Returns the browser Supabase client initialized strictly with the public
 * publishable anon key. Never uses or exposes privileged server keys.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!clientEnv.isSupabaseConfigured) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
