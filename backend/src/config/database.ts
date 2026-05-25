import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './index';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase client with service role key (bypasses RLS)
 * Use this for admin operations that need to bypass row level security
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin;
}

/**
 * Get Supabase client with anon key (respects RLS)
 * Use this for user-scoped operations
 */
export function getSupabaseClient(authToken?: string): SupabaseClient {
  const options: Record<string, unknown> = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  if (authToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  }

  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    options
  );
}

export default {
  getSupabaseAdmin,
  getSupabaseClient,
};
