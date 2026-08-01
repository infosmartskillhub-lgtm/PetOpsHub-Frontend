// src/types/auth.ts
// Central type definitions for PetOpsHub authentication and user context.

export interface UserProfile {
  id: string;           // Supabase auth user ID (sub)
  email: string | undefined;
  role: string | undefined;
  organization_id: string;
  branch_id: string | undefined;
  profile_id: string;   // user_profiles.id (PK)
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;   // Unix timestamp
}

export interface AuthState {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/** Shape returned by GET /api/v1/auth/me */
export interface MeResponse {
  success: boolean;
  data: UserProfile;
}
