export interface MedicalRecord {
  id: string;
  organization_id: string;
  branch_id: string;
  appointment_id?: string;
  client_id: string;
  pet_id: string;
  medical_record_code: string;
  visit_type: string;
  visit_status: string;
  chief_complaint?: string | null;
  history_of_present_illness?: string | null;
  physical_examination?: string | null;
  diagnosis_summary?: string | null;
  treatment_summary?: string | null;
  attending_veterinarian_id?: string | null;
  visit_date: string;
  visit_time?: string | null;
  follow_up_required: boolean;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordListResponse {
  success: boolean;
  data: MedicalRecord[];
}
