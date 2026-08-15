// src/services/pet.service.ts
// Service layer for the Pet resource.
//
// Convention matches dashboard.service.ts:
//   - Uses the shared `api` Axios instance from lib/axios.ts.
//   - The request interceptor on that instance automatically attaches the
//     Supabase Bearer token, so no manual auth handling is needed here.
//   - Response shape: Axios wraps the raw HTTP body in `response.data`.
//     The backend further wraps payloads in a `{ success, data }` envelope.
//
// Return value strategy:
//   - getAll   → returns the full PetListResponse (response.data) so callers
//                retain access to pagination metadata: total, page, limit.
//   - getById  → returns Pet (response.data.data) — single entity unwrap.
//   - create   → returns Pet (response.data.data) — single entity unwrap.
//   - update   → returns Pet (response.data.data) — single entity unwrap.
//   - delete   → returns PetDeleteResponse (response.data) — message field needed.

import { api } from '@/lib/axios';
import type {
  Pet,
  PetListResponse,
  PetDetailResponse,
  PetMutationResponse,
  PetDeleteResponse,
  CreatePetPayload,
  UpdatePetPayload,
  PetListQueryParams,
} from '@/types/pet';

export const petService = {
  /**
   * GET /pets
   * Returns the paginated pet list plus total, page, and limit metadata.
   * Supports optional filters: search, client_id, branch_id, species, status,
   * page, limit (all defined in PetListQueryParams / getPetsQuerySchema).
   */
  getAll: async (params?: PetListQueryParams): Promise<PetListResponse> => {
    // Axios serialises the params object into a URL query string automatically.
    const response = await api.get<PetListResponse>('/portal/pets', { params });
    // response.data IS the PetListResponse envelope: { success, data, total, page, limit }
    return response.data;
  },

  /**
   * GET /portal/pets/:id
   * Returns a single Pet entity for the given UUID.
   */
  getById: async (id: string): Promise<Pet> => {
    const response = await api.get<PetDetailResponse>(`/portal/pets/${id}`);
    return response.data.data;
  },

  /**
   * POST /portal/pets
   * Creates a new pet. Returns the newly created Pet entity.
   * Required fields: client_id, branch_id, pet_name, species.
   */
  create: async (payload: CreatePetPayload): Promise<Pet> => {
    const response = await api.post<PetMutationResponse>('/portal/pets', payload);
    return response.data.data;
  },

  /**
   * PUT /portal/pets/:id
   * Partial update of an existing pet. All payload fields are optional.
   * Returns the updated Pet entity.
   */
  update: async (id: string, payload: UpdatePetPayload): Promise<Pet> => {
    const response = await api.put<PetMutationResponse>(`/portal/pets/${id}`, payload);
    return response.data.data;
  },

  /**
   * DELETE /portal/pets/:id
   * Soft-deletes a pet (sets deleted_at on the backend; row is not removed).
   * Returns { success: true, message: "Pet deleted successfully" }.
   */
  delete: async (id: string): Promise<PetDeleteResponse> => {
    const response = await api.delete<PetDeleteResponse>(`/portal/pets/${id}`);
    return response.data;
  },
};
