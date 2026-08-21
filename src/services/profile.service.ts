// src/services/profile.service.ts
// Service layer for the Client Profile resource.
//
// Uses the shared `api` Axios instance from lib/axios.ts.
// The request interceptor on that instance automatically attaches the
// Supabase Bearer token — no manual auth handling is needed here.
//
// Endpoints:
//   GET /portal/client  → returns the full client record (incl. client_addresses)
//   PUT /portal/client  → partial update of personal/contact fields ONLY

import { api } from '@/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClientProfileData {
  id: string;
  organization_id: string;
  branch_id?: string;
  auth_user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  preferred_language?: string | null;
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp' | null;
  client_addresses?: unknown[];
}

/** Allowed update fields — identity/ownership fields intentionally excluded. */
export interface UpdateClientProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  preferred_language?: string | null;
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp' | null;
}

interface ProfileResponse {
  success: boolean;
  data: ClientProfileData;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const profileService = {
  /**
   * GET /portal/client
   * Returns the full client profile including client_addresses.
   */
  get: async (): Promise<ClientProfileData> => {
    const response = await api.get<ProfileResponse>('/portal/client');
    return response.data.data;
  },

  /**
   * PUT /portal/client
   * Partial update — only personal/contact fields.
   * Do NOT include id, email, organization_id, branch_id, auth_user_id, status, etc.
   * Returns the updated client record.
   */
  update: async (payload: UpdateClientProfilePayload): Promise<ClientProfileData> => {
    const response = await api.put<ProfileResponse>('/portal/client', payload);
    return response.data.data;
  },
};
