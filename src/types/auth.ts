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

export interface ClientProfile {
  id: string;           // clients.id
  auth_user_id?: string;
  email: string | undefined;
  first_name?: string;
  last_name?: string;
  organization_id: string;
  branch_id: string | undefined;
  role?: string;        // Optional, not heavily used in client portal
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;   // Unix timestamp
}

export interface AuthState {
  user: ClientProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/** Shape returned by GET /portal/me */
export interface PortalMeResponse {
  success: boolean;
  data: ClientProfile;
}
