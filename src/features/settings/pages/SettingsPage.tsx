// src/features/settings/pages/SettingsPage.tsx
// Client Settings page — manages communication preferences.
//
// Data flow:
//   useQuery(['clientProfile']) → profileService.get() → GET /portal/client
//   useMutation (preferences) → profileService.update({preferred_language, preferred_contact_method})
//                             → PUT /portal/client
//
// Security:
//   - Only preferred_language and preferred_contact_method are ever sent in the payload.
//   - id, email, organization_id, branch_id, auth_user_id, first_name, last_name,
//     phone, status are intentionally NEVER included in the update payload.
//   - Notification and Privacy sections are static "coming soon" — no backend calls.
//
// Design conventions match DashboardPage / MyPetsPage / ProfilePage:
//   bg-slate-900 base · slate-800/80 cards · teal-400/500 accent · lucide-react icons

import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type UpdateClientProfilePayload } from '@/services/profile.service';
import {
  MessageSquare,
  Globe,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTACT_METHODS = ['Email', 'Phone', 'SMS', 'WhatsApp'] as const;
type ContactMethod = (typeof CONTACT_METHODS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  icon: Icon,
  children,
  locked,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  locked?: boolean;
}) => (
  <div
    className={`rounded-xl border bg-slate-800/80 p-6 shadow-sm ${
      locked ? 'border-slate-700/40 opacity-60' : 'border-slate-800'
    }`}
  >
    <div className="mb-5 flex items-center justify-between border-b border-slate-700/50 pb-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-teal-400" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {locked && (
        <span className="flex items-center gap-1.5 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-400">
          <Lock className="h-3 w-3" />
          Coming Soon
        </span>
      )}
    </div>
    {children}
  </div>
);

const FieldRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
    <div className="w-52 shrink-0">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const queryClient = useQueryClient();

  // ── Remote data ──────────────────────────────────────────────────────────
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['clientProfile'],
    queryFn: profileService.get,
  });

  // ── Preferences form state ───────────────────────────────────────────────
  const [language, setLanguage]         = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod | ''>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // Sync from API response
  useEffect(() => {
    if (profile) {
      setLanguage(profile.preferred_language ?? '');
      setContactMethod((profile.preferred_contact_method as ContactMethod) ?? '');
    }
  }, [profile]);

  // ── Mutation ─────────────────────────────────────────────────────────────
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpdateClientProfilePayload) => profileService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      setSuccessMsg('Preferences saved successfully.');
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save preferences. Please try again.';
      setErrorMsg(msg);
      setSuccessMsg(null);
    },
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // PAYLOAD: only preference fields — NO identity/ownership fields ever included
    const payload: UpdateClientProfilePayload = {
      preferred_language: language.trim() || null,
      preferred_contact_method: (contactMethod as ContactMethod) || null,
    };

    savePreferences(payload);
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
          <p className="font-semibold">Error Loading Settings</p>
          <p className="text-sm opacity-80">We could not load your settings. Please try again later.</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-slate-400">Manage your communication preferences and account options.</p>
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

        {/* ── Communication Preferences ────────────────────────────────── */}
        <SectionCard title="Communication Preferences" icon={MessageSquare}>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Preferred Language */}
            <FieldRow
              label="Preferred Language"
              description="Language used for communications and notifications."
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English, Spanish, French"
                  disabled={isSaving}
                  className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </FieldRow>

            {/* Preferred Contact Method */}
            <FieldRow
              label="Preferred Contact Method"
              description="How you'd like us to reach you for updates and reminders."
            >
              <div className="flex flex-wrap gap-3">
                {CONTACT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setContactMethod(method === contactMethod ? '' : method)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      contactMethod === method
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                        : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {contactMethod && (
                <p className="mt-2 text-xs text-slate-500">
                  Currently selected: <span className="text-teal-400">{contactMethod}</span>
                </p>
              )}
            </FieldRow>

            {/* Save */}
            <div className="border-t border-slate-700/50 pt-5">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Notifications — Coming Soon ──────────────────────────────── */}
        <SectionCard title="Notifications" icon={Bell} locked>
          <div className="space-y-4">
            {[
              { label: 'Appointment Reminders', description: 'Receive reminders before scheduled appointments.' },
              { label: 'Invoice Alerts', description: 'Get notified when a new invoice is issued.' },
              { label: 'Pet Health Updates', description: 'Receive notifications about vaccination due dates.' },
            ].map(({ label, description }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <p className="text-xs text-slate-600">{description}</p>
                </div>
                <div className="h-5 w-10 cursor-not-allowed rounded-full bg-slate-700" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Privacy & Security — Coming Soon ────────────────────────── */}
        <SectionCard title="Privacy & Security" icon={ShieldCheck} locked>
          <div className="space-y-4">
            {[
              { label: 'Change Password', description: 'Update your account password.' },
              { label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account.' },
              { label: 'Data Export', description: 'Download a copy of your personal data.' },
            ].map(({ label, description }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <p className="text-xs text-slate-600">{description}</p>
                </div>
                <span className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-500">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
};
