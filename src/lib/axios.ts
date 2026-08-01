// src/lib/axios.ts
// Configured Axios instance for all PetOpsHub Backend API calls.
//
// Interceptor chain (per request):
//   1. Request interceptor — injects the current Supabase access_token as Bearer.
//   2. Response interceptor — handles 401 (expired token) by triggering Supabase refresh
//      and retrying the original request once.
//
// Organization and branch context are sourced from the JWT itself on the backend side
// (via jwtAuth middleware → user_profiles table lookup). The frontend does NOT need to
// manually inject org_id or branch_id — the backend derives them from the verified token.

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  throw new Error(
    'Missing VITE_API_BASE_URL environment variable. ' +
    'Ensure it is set in your .env file.'
  );
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 30 second timeout for all requests.
  timeout: 30_000,
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Attaches the current Supabase access_token to every outgoing request.
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401 Unauthorized:
//   1. Attempt one silent token refresh via Supabase.
//   2. If refresh succeeds, retry the original request with the new token.
//   3. If refresh fails, the session is fully expired — sign out the user.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        // Refresh token is also invalid or expired — force logout.
        await supabase.auth.signOut();
        return Promise.reject(error);
      }

      // Retry original request with the newly refreshed token.
      originalRequest.headers['Authorization'] = `Bearer ${refreshData.session.access_token}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
