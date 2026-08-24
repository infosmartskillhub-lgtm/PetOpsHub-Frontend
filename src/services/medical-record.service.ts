import { api } from '@/lib/axios';
import type { MedicalRecordListResponse, MedicalRecord } from '@/types/medical-record';

export const medicalRecordService = {
  /**
   * GET /portal/pets/:petId/medical-records
   * Returns read-only medical records for a specific pet.
   */
  getByPetId: async (petId: string): Promise<MedicalRecord[]> => {
    const response = await api.get<MedicalRecordListResponse>(`/portal/pets/${petId}/medical-records`);
    return response.data.data;
  },
};
