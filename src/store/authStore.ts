// src/store/authStore.ts
// Zustand store for authentication state.
//
// Responsibilities:
//   - Holds the current UserProfile and session state.
//   - Provides login(), logout(), and initialize() actions.
//   - Subscribes to Supabase onAuthStateChange so any tab/window session event
//     (refresh, sign-out, sign-in) is reflected immediately in the UI.
//   - After Supabase login, calls GET /api/v1/auth/me to fetch the full
//     UserProfile (role, organization_id, branch_id) from the backend.

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/axios';
import type { UserProfile, MeResponse } from '@/types/auth';

interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  /** Call once on app startup to rehydrate session from Supabase localStorage. */
  initialize: () => Promise<void>;
  /** Email + password login via Supabase. Fetches /auth/me after success. */
  login: (email: string, password: string) => Promise<void>;
  /** Signs out of Supabase (invalidates refresh token server-side). */
  logout: () => Promise<void>;
  /** Internal: fetch and store the UserProfile from /api/v1/auth/me. */
  _fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ─── Initialize ─────────────────────────────────────────────────────────────
  // Called in main.tsx before rendering. Restores an existing Supabase session
  // from localStorage and fetches the backend user profile.
  // Also wires the onAuthStateChange listener for cross-tab sync.
  initialize: async () => {
    set({ isLoading: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // We have a valid session — fetch the backend profile.
        await get()._fetchProfile();
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }

    // Listen for future auth events (token refresh, sign-out from another tab, etc.)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          await get()._fetchProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAuthenticated: false });
      }
    });
  },

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      // _fetchProfile will be called by onAuthStateChange(SIGNED_IN),
      // but we also call it directly here for immediate UI response.
      await get()._fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  // Calls Supabase signOut which invalidates the refresh token server-side.
  // The access_token remains valid until natural expiry (~1h) but cannot be renewed.
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  // ─── Fetch Profile ──────────────────────────────────────────────────────────
  // Calls the backend GET /api/v1/auth/me to retrieve the full UserProfile
  // including organization_id, branch_id, and role — the multi-tenant context.
  _fetchProfile: async () => {
    try {
      const response = await api.get<MeResponse>('/auth/me');
      set({
        user: response.data.data,
        isAuthenticated: true,
      });
    } catch {
      // Backend rejected the token or profile not found — clear state.
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
