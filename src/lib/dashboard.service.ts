import { api } from './axios';

export interface Vaccination {
  id: string;
  pet_id: string;
  vaccine_id?: string;
  custom_vaccine_name?: string;
  administration_date: string;
  vaccination_number?: string;
  reminder_enabled: boolean;
  reminder_date?: string;
  next_due_date?: string;
  expiration_date?: string;
  vaccine_type?: string;
  manufacturer?: string;
  batch_number?: string;
  serial_number?: string;
  dose?: string;
  route?: string;
  administered_by?: string;
  clinic_name?: string;
  certificate_number?: string;
  adverse_reaction: boolean;
  adverse_reaction_notes?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const getClientPetVaccinations = async (petId: string): Promise<Vaccination[]> => {
  const response = await api.get(`/portal/pets/${petId}/vaccinations`);
  return response.data.data;
};
