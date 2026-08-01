// src/lib/supabase.ts
// Single Supabase client instance for the entire frontend application.
// Uses the anon key — safe for client-side use.
// All data access is protected by Supabase RLS and our backend's jwtAuth middleware.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so the user stays logged in across page refreshes.
    persistSession: true,
    // Automatically refresh the access_token before it expires.
    // The Supabase client handles this natively — no custom /auth/refresh endpoint needed.
    autoRefreshToken: true,
    // Detect session from URL hash (required for OAuth and magic-link flows).
    detectSessionInUrl: true,
  },
});
