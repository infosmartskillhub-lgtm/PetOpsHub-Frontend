export interface DashboardKPIs {
  total_clients: number;
  total_pets: number;
  active_medical_records: number;
  upcoming_appointments_today: number;
  completed_appointments_today: number;
  active_prescriptions: number;
  open_medical_cases: number;
}

export interface DashboardAppointments {
  today: number;
  this_week: number;
  this_month: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface DashboardMedical {
  records_created: number;
  clinical_notes_created: number;
  diagnoses_created: number;
  prescriptions_issued: number;
}

export interface DashboardPets {
  species_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
}

export interface DashboardSummaryData {
  kpis: DashboardKPIs;
  appointments: DashboardAppointments;
  medical: DashboardMedical;
  pets: DashboardPets;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummaryData;
}
