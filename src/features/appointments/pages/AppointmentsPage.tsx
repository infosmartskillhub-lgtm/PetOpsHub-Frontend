// src/features/appointments/pages/AppointmentsPage.tsx
// Client portal — Appointment list + booking form.
//
// Data flow:
//   Appointments: useQuery(['appointments']) → appointmentService.getAll()
//     → GET /portal/appointments (Bearer token via Axios interceptor)
//   Pets:         useQuery(['pets'])          → petService.getAll()
//     → GET /pets (Bearer token via Axios interceptor)
//
// Booking form submits via useMutation → appointmentService.create(payload)
//     → POST /portal/appointments
//
// Design matches DashboardPage / MyPetsPage conventions:
//   bg-slate-900, slate-800/80 cards, teal-400/500 accent, lucide-react icons.

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, type Appointment, type CreateAppointmentPayload, type AppointmentType, APPOINTMENT_TYPE_VALUES } from '@/services/appointment.service';
import { petService } from '@/services/pet.service';
import type { Pet } from '@/types/pet';
import {
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PawPrint,
  X,
  FileText,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format ISO date string to a human-readable format. */
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

/** Format HH:mm time string to a human-readable format. */
const formatTime = (time: string): string => {
  if (!time) return '—';
  try {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return time;
  }
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Scheduled:  'bg-blue-500/15 text-blue-300   border border-blue-500/30',
  Confirmed:  'bg-teal-500/15 text-teal-300   border border-teal-500/30',
  Completed:  'bg-green-500/15 text-green-300 border border-green-500/30',
  Cancelled:  'bg-red-500/15   text-red-400   border border-red-500/30',
  'No Show':  'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  'In Progress': 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
};

const AppointmentStatusBadge = ({ status }: { status?: string }) => {
  const s = status ?? 'Scheduled';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}
    >
      {s}
    </span>
  );
};

// ─── Appointment card ─────────────────────────────────────────────────────────
const AppointmentCard = ({
  appointment,
  petMap,
}: {
  appointment: Appointment;
  petMap: Map<string, Pet>;
}) => {
  const pet = petMap.get(appointment.pet_id);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800">
      {/* Top row: pet info + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/20 ring-2 ring-teal-500/30">
            <PawPrint className="h-5 w-5 text-teal-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {pet ? pet.pet_name : 'Unknown Pet'}
            </h3>
            <p className="text-xs text-slate-500">
              {appointment.service_module} · {appointment.appointment_type}
            </p>
          </div>
        </div>
        <AppointmentStatusBadge status={appointment.appointment_status} />
      </div>

      {/* Detail grid */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-700/60 pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</span>
          <span className="text-sm text-slate-300">{formatDate(appointment.appointment_date)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Time</span>
          <span className="text-sm text-slate-300">
            {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Duration</span>
          <span className="text-sm text-slate-300">
            {appointment.estimated_duration_minutes
              ? `${appointment.estimated_duration_minutes} min`
              : '—'}
          </span>
        </div>
      </div>

      {/* Reason for visit */}
      {appointment.reason_for_visit && (
        <div className="mt-3 border-t border-slate-700/60 pt-3">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
            <p className="text-sm text-slate-400">{appointment.reason_for_visit}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Form validation ──────────────────────────────────────────────────────────
interface FormErrors {
  pet_id?: string;
  service_module?: string;
  appointment_type?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  estimated_duration_minutes?: string;
}

/**
 * Local form state type.
 * appointment_type is '' when no option has been selected yet.
 * Once submitted it must be a valid AppointmentType — enforced by validateForm.
 */
type FormState = Omit<CreateAppointmentPayload, 'appointment_type'> & {
  appointment_type: AppointmentType | '';
};

const validateForm = (form: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!form.pet_id) errors.pet_id = 'Please select a pet.';
  if (!form.service_module.trim()) errors.service_module = 'Service module is required.';

  // Guard 1: field must not be empty.
  if (!form.appointment_type) {
    errors.appointment_type = 'Appointment type is required.';
  } else if (!(APPOINTMENT_TYPE_VALUES as readonly string[]).includes(form.appointment_type)) {
    // Guard 2: runtime enum membership — value must be one of the backend-accepted types.
    errors.appointment_type = 'Invalid appointment type selected. Please choose a valid option.';
  }

  if (!form.appointment_date) errors.appointment_date = 'Appointment date is required.';
  if (!form.start_time) errors.start_time = 'Start time is required.';
  if (!form.end_time) errors.end_time = 'End time is required.';

  if (form.start_time && form.end_time && form.end_time <= form.start_time) {
    errors.end_time = 'End time must be later than start time.';
  }

  if (
    form.estimated_duration_minutes !== undefined &&
    form.estimated_duration_minutes !== null &&
    (isNaN(form.estimated_duration_minutes) || form.estimated_duration_minutes <= 0)
  ) {
    errors.estimated_duration_minutes = 'Duration must be a positive number.';
  }

  return errors;
};

const INITIAL_FORM: FormState = {
  pet_id: '',
  service_module: '',
  appointment_type: '',
  appointment_date: '',
  start_time: '',
  end_time: '',
  estimated_duration_minutes: undefined,
  reason_for_visit: '',
};


// ─── Service module / appointment type options ────────────────────────────────
//
// SERVICE_MODULES: free-text strings sent as `service_module` in the payload.
// The backend accepts any non-empty string for service_module, so these values
// are display-only and can evolve without a backend change.
//
// APPOINTMENT_TYPES: each entry has a human-readable `label` (shown in the UI)
// and a backend-compatible `value` (sent in the POST payload).
// IMPORTANT: every `value` MUST be an exact member of AppointmentType, which
// mirrors the backend Zod `appointmentTypeEnum`. Do NOT add new values here
// without first adding them to the backend enum.
//
// Mapping rationale:
//   Veterinary  → Consultation, Vaccination, Surgery, Emergency, Follow-up, Wellness
//   Grooming    → Grooming  (single canonical backend value for all grooming sub-types)
//   Boarding    → Boarding  (single canonical backend value for all boarding sub-types)
//   Training    → Training, Consultation (behaviour consult maps to Consultation)
//   Daycare     → Other     (no dedicated Daycare value in backend enum)
//   Wellness    → Wellness, Consultation
const SERVICE_MODULES = [
  'Veterinary',
  'Grooming',
  'Boarding',
  'Training',
  'Daycare',
  'Wellness',
] as const;

/** Shape of each option in the appointment-type dropdown. */
interface AppointmentTypeOption {
  /** Human-readable label shown in the select element. */
  label: string;
  /** Exact value submitted to the backend — must be a valid AppointmentType. */
  value: AppointmentType;
}

const APPOINTMENT_TYPES: Record<string, AppointmentTypeOption[]> = {
  Veterinary: [
    { label: 'Consultation / General Checkup', value: 'Consultation' },
    { label: 'Vaccination',                    value: 'Vaccination'  },
    { label: 'Surgery',                        value: 'Surgery'      },
    { label: 'Emergency Visit',                value: 'Emergency'    },
    { label: 'Follow-up',                      value: 'Follow-up'    },
    { label: 'Wellness Exam',                  value: 'Wellness'     },
  ],
  Grooming: [
    { label: 'Grooming (Full / Bath / Nail / Ear)', value: 'Grooming' },
    { label: 'Other Grooming Service',              value: 'Other'    },
  ],
  Boarding: [
    { label: 'Boarding Stay',       value: 'Boarding' },
    { label: 'Other Boarding Stay', value: 'Other'    },
  ],
  Training: [
    { label: 'Training Session',            value: 'Training'     },
    { label: 'Behaviour Consultation',      value: 'Consultation' },
    { label: 'Other Training Service',      value: 'Other'        },
  ],
  // Daycare has no direct match in the backend enum. We map all Daycare
  // appointments to 'Other', which is always valid.
  Daycare: [
    { label: 'Full Day Daycare',  value: 'Other' },
    { label: 'Half Day Daycare',  value: 'Other' },
    { label: 'Trial Day Daycare', value: 'Other' },
  ],
  Wellness: [
    { label: 'Wellness Exam',        value: 'Wellness'     },
    { label: 'Wellness Consult',     value: 'Consultation' },
    { label: 'Other Wellness Visit', value: 'Other'        },
  ],
};


// ─── Main page component ──────────────────────────────────────────────────────
export const AppointmentsPage = () => {
  const queryClient = useQueryClient();

  // ── State ─────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMsg, setSuccessMsg] = useState('');

  // ── Queries ───────────────────────────────────────────────────────────────
  const {
    data: appointments,
    isLoading: apptLoading,
    isError: apptError,
    refetch: refetchAppts,
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll,
  });

  const {
    data: petData,
    isLoading: petsLoading,
    isError: petsError,
    refetch: refetchPets,
  } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petService.getAll({ limit: 100 }),
  });

  const pets: Pet[] = petData?.data ?? [];
  const activePets = pets.filter((p) => p.status === 'Active');

  // Build a lookup map for pet names in the appointment list.
  const petMap = new Map<string, Pet>();
  for (const pet of pets) {
    petMap.set(pet.id, pet);
  }

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => {
      setSuccessMsg('Appointment booked successfully!');
      setForm({ ...INITIAL_FORM });
      setFormErrors({});
      setShowForm(false);
      // Refresh appointment list via React Query cache invalidation.
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Also refresh dashboard summary if cached.
      void queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      // Clear success after 6 seconds.
      setTimeout(() => setSuccessMsg(''), 6000);
    },
  });

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'estimated_duration_minutes'
        ? (value === '' ? undefined : Number(value))
        : value,
    }));
    // Clear field error on change.
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleServiceModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, service_module: value, appointment_type: '' }));
    if (formErrors.service_module) {
      setFormErrors((prev) => ({ ...prev, service_module: undefined }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Build clean payload — omit empty optional fields.
    // appointment_type is guaranteed to be a valid AppointmentType here
    // because validateForm() above would have returned errors and returned early
    // if it were empty or not in the APPOINTMENT_TYPE_VALUES set.
    const payload: CreateAppointmentPayload = {
      pet_id: form.pet_id,
      service_module: form.service_module,
      appointment_type: form.appointment_type as AppointmentType,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: form.end_time,
    };
    if (form.estimated_duration_minutes && form.estimated_duration_minutes > 0) {
      payload.estimated_duration_minutes = form.estimated_duration_minutes;
    }
    if (form.reason_for_visit?.trim()) {
      payload.reason_for_visit = form.reason_for_visit.trim();
    }

    createMutation.mutate(payload);
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm({ ...INITIAL_FORM });
    setFormErrors({});
    createMutation.reset();
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  const isLoading = apptLoading || petsLoading;
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  const hasError = apptError || petsError;
  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-800 bg-red-900/50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">Failed to load data</p>
                <p className="mt-1 text-sm text-red-300/80">
                  {apptError && 'Could not load appointments. '}
                  {petsError && 'Could not load pets. '}
                  Check your connection and try again.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (apptError) void refetchAppts();
                if (petsError) void refetchPets();
              }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-800/60 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Available appointment types for the selected service module ──────────
  const appointmentTypes = APPOINTMENT_TYPES[form.service_module] ?? [];

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Appointments</h1>
            <p className="mt-1 text-slate-400">
              View your upcoming appointments and book new visits.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setSuccessMsg('');
              createMutation.reset();
            }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" />
            Book Appointment
          </button>
        </div>

        {/* Success message ─────────────────────────────────────────────────── */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-teal-800 bg-teal-900/40 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-400" />
            <p className="text-sm font-medium text-teal-200">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg('')}
              className="ml-auto text-teal-400 transition-colors hover:text-teal-300"
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Booking form ────────────────────────────────────────────────────── */}
        {showForm && (
          <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Book New Appointment</h2>
              <button
                onClick={handleCancel}
                className="text-slate-400 transition-colors hover:text-slate-200"
                aria-label="Close booking form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mutation error */}
            {createMutation.isError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-800 bg-red-900/50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-red-200">Booking failed</p>
                  <p className="mt-1 text-sm text-red-300/80">
                    {(createMutation.error as any)?.response?.data?.message
                      ?? (createMutation.error as Error)?.message
                      ?? 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Pet selection */}
                <FormField label="Pet" error={formErrors.pet_id} required>
                  <select
                    id="appt-pet"
                    name="pet_id"
                    value={form.pet_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select a pet…</option>
                    {activePets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.pet_name} — {pet.species}{pet.breed ? ` (${pet.breed})` : ''}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Service Module */}
                <FormField label="Service Module" error={formErrors.service_module} required>
                  <select
                    id="appt-service-module"
                    name="service_module"
                    value={form.service_module}
                    onChange={handleServiceModuleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select a service…</option>
                    {SERVICE_MODULES.map((mod) => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </FormField>

                {/* Appointment Type */}
                <FormField label="Appointment Type" error={formErrors.appointment_type} required>
                  <select
                    id="appt-type"
                    name="appointment_type"
                    value={form.appointment_type}
                    onChange={handleChange}
                    disabled={!form.service_module}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {form.service_module ? 'Select a type…' : 'Select service first'}
                    </option>
                    {appointmentTypes.map((opt) => (
                      // key uses both value and label because the same backend value
                      // can appear under multiple display labels (e.g. Daycare → 'Other').
                      <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Appointment Date */}
                <FormField label="Appointment Date" error={formErrors.appointment_date} required>
                  <input
                    id="appt-date"
                    type="date"
                    name="appointment_date"
                    value={form.appointment_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </FormField>

                {/* Start Time */}
                <FormField label="Start Time" error={formErrors.start_time} required>
                  <input
                    id="appt-start-time"
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </FormField>

                {/* End Time */}
                <FormField label="End Time" error={formErrors.end_time} required>
                  <input
                    id="appt-end-time"
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </FormField>

                {/* Estimated Duration */}
                <FormField label="Estimated Duration (min)" error={formErrors.estimated_duration_minutes}>
                  <input
                    id="appt-duration"
                    type="number"
                    name="estimated_duration_minutes"
                    value={form.estimated_duration_minutes ?? ''}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g. 30"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </FormField>
              </div>

              {/* Reason for Visit — full width */}
              <FormField label="Reason for Visit">
                <textarea
                  id="appt-reason"
                  name="reason_for_visit"
                  value={form.reason_for_visit ?? ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the reason for this visit…"
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </FormField>

              {/* Form actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 pt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointment list ─────────────────────────────────────────────────── */}
        {(appointments?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 py-20 text-center">
            <Calendar className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-semibold text-white">No appointments yet</h3>
            <p className="mt-1 max-w-xs text-sm text-slate-400">
              Your scheduled appointments will appear here. Click "Book Appointment" to get started.
            </p>
          </div>
        )}

        {appointments && appointments.length > 0 && (
          <>
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="text-slate-300">{appointments.length}</span>{' '}
              {appointments.length === 1 ? 'appointment' : 'appointments'}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {appointments.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} petMap={petMap} />
              ))}
            </div>
          </>
        )}

        {/* Manual refresh ──────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={() => void refetchAppts()}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Refresh appointment list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Reusable form field wrapper ──────────────────────────────────────────────
const FormField = ({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-300">
      {label}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);
