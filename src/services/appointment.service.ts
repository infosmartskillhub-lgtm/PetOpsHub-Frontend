// src/services/appointment.service.ts
// Service layer for the Appointment resource (portal scope).
//
// Convention matches pet.service.ts:
//   - Uses the shared `api` Axios instance from lib/axios.ts.
//   - The request interceptor on that instance automatically attaches the
//     Supabase Bearer token, so no manual auth handling is needed here.
//   - Response shape: Axios wraps the raw HTTP body in `response.data`.
//     The backend further wraps payloads in a `{ success, data }` envelope.
//
// Return value strategy:
//   - getAll  → returns Appointment[] (response.data.data) — unwrapped array.
//   - create  → returns Appointment  (response.data.data) — single entity unwrap.
//
// Organization and branch context are derived by the backend from the
// verified JWT (via jwtAuth middleware → user_profiles lookup).
// The frontend does NOT need to supply org_id, branch_id, or client_id.

import { api } from '@/lib/axios';

// ─── Domain Types ─────────────────────────────────────────────────────────────

/**
 * Appointment types accepted by POST /portal/appointments.
 *
 * These values are the EXACT strings enforced by the backend Zod schema
 * (appointmentTypeEnum in appointment.schema.ts) and the DB check constraint.
 * Do NOT change these values without updating the backend enum first.
 */
export type AppointmentType =
  | 'Consultation'
  | 'Vaccination'
  | 'Surgery'
  | 'Grooming'
  | 'Boarding'
  | 'Training'
  | 'Follow-up'
  | 'Emergency'
  | 'Wellness'
  | 'Other';

/** All valid AppointmentType values as a runtime-accessible tuple. */
export const APPOINTMENT_TYPE_VALUES: readonly AppointmentType[] = [
  'Consultation',
  'Vaccination',
  'Surgery',
  'Grooming',
  'Boarding',
  'Training',
  'Follow-up',
  'Emergency',
  'Wellness',
  'Other',
] as const;

/**
 * Represents a single appointment entity as returned by the portal API.
 * Fields mirror the backend Appointment model visible to portal clients.
 */
export interface Appointment {
  id: string;
  pet_id: string;
  service_module: string;
  appointment_type: string;
  appointment_date: string;    // ISO 8601 date string, e.g. "2026-08-20"
  start_time: string;          // HH:mm, e.g. "09:00"
  end_time: string;            // HH:mm, e.g. "10:00"
  estimated_duration_minutes?: number;
  reason_for_visit?: string;
  appointment_status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload accepted by POST /portal/appointments.
 *
 * Only the fields that the portal client is permitted to supply are listed
 * here. Server-side fields (client_id, organization_id, branch_id,
 * appointment_status, appointment_source, appointment_code, created_by,
 * internal_notes, reminder_sent) are intentionally excluded.
 *
 * appointment_type is typed as AppointmentType (literal union) so TypeScript
 * rejects any value that is not in the backend enum at compile time.
 */
export interface CreateAppointmentPayload {
  pet_id: string;
  service_module: string;
  appointment_type: AppointmentType;
  appointment_date: string;    // ISO 8601 date string, e.g. "2026-08-20"
  start_time: string;          // HH:mm, e.g. "09:00"
  end_time: string;            // HH:mm, e.g. "10:00"
  estimated_duration_minutes?: number;
  reason_for_visit?: string;
}

// ─── Response Envelope Types ──────────────────────────────────────────────────

/**
 * Backend envelope for GET /portal/appointments.
 * Shape: { success: true, data: Appointment[] }
 */
interface PortalAppointmentsResponse {
  success: boolean;
  data: Appointment[];
}

/**
 * Backend envelope for POST /portal/appointments.
 * Shape: { success: true, data: Appointment }
 */
interface PortalAppointmentCreateResponse {
  success: boolean;
  data: Appointment;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const appointmentService = {
  /**
   * GET /portal/appointments
   * Returns all appointments visible to the authenticated portal client.
   * The backend filters by org/branch derived from the JWT automatically.
   */
  getAll: async (): Promise<Appointment[]> => {
    const response = await api.get<PortalAppointmentsResponse>('/portal/appointments');
    return response.data.data;
  },

  /**
   * POST /portal/appointments
   * Creates a new appointment for the authenticated portal client.
   * Returns the newly created Appointment entity.
   */
  create: async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const response = await api.post<PortalAppointmentCreateResponse>('/portal/appointments', payload);
    return response.data.data;
  },
};
