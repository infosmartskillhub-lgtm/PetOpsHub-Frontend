// src/features/profile/pages/ProfilePage.tsx
// Client Profile page — displays and allows editing of the authenticated client's
// personal and contact information.
//
// Data flow:
//   useQuery(['clientProfile']) → profileService.get() → GET /portal/client
//   useMutation             → profileService.update() → PUT /portal/client
//
// Security:
//   - email is displayed READ-ONLY and never included in the PUT payload.
//   - id, organization_id, branch_id, auth_user_id, status are never sent.
//   - All field values are derived from the API response, not the auth store,
//     to ensure freshness.
//
// Design conventions match DashboardPage / MyPetsPage:
//   bg-slate-900 base · slate-800/80 cards · teal-400/500 accent · lucide-react icons

import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type UpdateClientProfilePayload } from '@/services/profile.service';
import { User, Mail, Phone, Globe, MessageSquare, Pencil, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTACT_METHODS = ['Email', 'Phone', 'SMS', 'WhatsApp'] as const;
type ContactMethod = (typeof CONTACT_METHODS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldRow = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
    <div className="flex w-44 shrink-0 items-center gap-2 text-sm font-medium text-slate-400">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const ReadonlyValue = ({ value }: { value?: string | null }) => (
  <span className="block rounded-lg border border-slate-700/50 bg-slate-700/30 px-3 py-2 text-sm text-slate-300">
    {value || <span className="italic text-slate-500">—</span>}
  </span>
);

const EditInput = ({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
  />
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ProfilePage = () => {
  const queryClient = useQueryClient();

  // ── Remote data ──────────────────────────────────────────────────────────
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['clientProfile'],
    queryFn: profileService.get,
  });

  // ── Edit state ───────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Form fields (only the mutable ones) ──────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [language, setLanguage]   = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod | ''>('');

  // Sync form fields when profile loads or editing starts
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setPhone(profile.phone ?? '');
      setLanguage(profile.preferred_language ?? '');
      setContactMethod((profile.preferred_contact_method as ContactMethod) ?? '');
    }
  }, [profile]);

  // ── Mutation ─────────────────────────────────────────────────────────────
  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpdateClientProfilePayload) => profileService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      setErrorMsg(msg);
      setSuccessMsg(null);
    },
  });

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (firstName.trim() === '') return 'First name must not be empty.';
    if (lastName.trim() === '')  return 'Last name must not be empty.';
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    // Build payload — ONLY allowed fields. email, id, org/branch NEVER sent.
    const payload: UpdateClientProfilePayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      preferred_language: language.trim() || null,
      preferred_contact_method: (contactMethod as ContactMethod) || null,
    };

    saveProfile(payload);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg(null);
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setPhone(profile.phone ?? '');
      setLanguage(profile.preferred_language ?? '');
      setContactMethod((profile.preferred_contact_method as ContactMethod) ?? '');
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-800 bg-red-900/50 p-4 text-red-200">
          <p className="font-semibold">Error Loading Profile</p>
          <p className="text-sm opacity-80">We could not load your profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Client';
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-slate-400">View and update your personal information.</p>
          </div>
        </div>

        {/* ── Success banner ───────────────────────────────────────────── */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-lg border border-teal-700/50 bg-teal-900/30 px-4 py-3 text-teal-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{successMsg}</span>
          </div>
        )}

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-6 shadow-sm">

          {/* Avatar + name header */}
          <div className="mb-6 flex items-center gap-4 border-b border-slate-700/50 pb-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xl font-bold text-teal-400 ring-2 ring-teal-500/30">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-slate-400">{profile?.email}</p>
            </div>
            {/* Edit / Cancel button (top-right of card) */}
            <div className="ml-auto">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsEditing(true); setSuccessMsg(null); setErrorMsg(null); }}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* First Name */}
            <FieldRow label="First Name" icon={User}>
              {isEditing ? (
                <EditInput
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="First name"
                  disabled={isSaving}
                />
              ) : (
                <ReadonlyValue value={profile?.first_name} />
              )}
            </FieldRow>

            {/* Last Name */}
            <FieldRow label="Last Name" icon={User}>
              {isEditing ? (
                <EditInput
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Last name"
                  disabled={isSaving}
                />
              ) : (
                <ReadonlyValue value={profile?.last_name} />
              )}
            </FieldRow>

            {/* Email — always read-only */}
            <FieldRow label="Email" icon={Mail}>
              <div className="flex items-center gap-2">
                <ReadonlyValue value={profile?.email} />
                <span className="shrink-0 rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-400">
                  read-only
                </span>
              </div>
            </FieldRow>

            {/* Phone */}
            <FieldRow label="Phone" icon={Phone}>
              {isEditing ? (
                <EditInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="e.g. +1 555 000 1234"
                  disabled={isSaving}
                />
              ) : (
                <ReadonlyValue value={profile?.phone} />
              )}
            </FieldRow>

            {/* Preferred Language */}
            <FieldRow label="Language" icon={Globe}>
              {isEditing ? (
                <EditInput
                  value={language}
                  onChange={setLanguage}
                  placeholder="e.g. English"
                  disabled={isSaving}
                />
              ) : (
                <ReadonlyValue value={profile?.preferred_language} />
              )}
            </FieldRow>

            {/* Preferred Contact Method */}
            <FieldRow label="Contact Method" icon={MessageSquare}>
              {isEditing ? (
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value as ContactMethod | '')}
                  disabled={isSaving}
                  className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">— Select —</option>
                  {CONTACT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <ReadonlyValue value={profile?.preferred_contact_method} />
              )}
            </FieldRow>

            {/* Save button (only visible while editing) */}
            {isEditing && (
              <div className="border-t border-slate-700/50 pt-5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
