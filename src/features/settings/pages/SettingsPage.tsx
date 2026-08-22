// src/features/settings/pages/SettingsPage.tsx
// Client Settings page — manages communication preferences.
//
// Data flow:
//   useQuery(['clientProfile']) → profileService.get() → GET /portal/client
//   useMutation (preferences) → profileService.update({preferred_language, preferred_contact_method})
//                             → PUT /portal/client
//
//   useQuery(['notificationPreferences']) → notificationService.getPreferences() → GET /portal/notification-preferences
//   useMutation (notificationPrefs) → notificationService.updatePreferences(prefs) → PUT /portal/notification-preferences
//
// Security:
//   - Only preferred_language and preferred_contact_method are ever sent in the profile payload.
//   - id, email, organization_id, branch_id, auth_user_id, first_name, last_name,
//     phone, status are intentionally NEVER included in the update payload.
//   - Notification preferences are rigorously filtered by Zod in the backend.
//
// Design conventions match DashboardPage / MyPetsPage / ProfilePage:
//   bg-slate-900 base · slate-800/80 cards · teal-400/500 accent · lucide-react icons

import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type UpdateClientProfilePayload } from '@/services/profile.service';
import { notificationService, type NotificationPreferences } from '@/services/notification.service';
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

const Toggle = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-teal-500' : 'bg-slate-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const queryClient = useQueryClient();

  // ── Remote data ──────────────────────────────────────────────────────────
  const { data: profile, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
    queryKey: ['clientProfile'],
    queryFn: profileService.get,
  });

  const { data: notifData, isLoading: isLoadingNotifs, isError: isNotifsError } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: notificationService.getPreferences,
  });

  const isLoading = isLoadingProfile || isLoadingNotifs;
  const isError = isProfileError || isNotifsError;

  // ── Profile form state ───────────────────────────────────────────────
  const [language, setLanguage]         = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod | ''>('');

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg]     = useState<string | null>(null);

  // Sync profile from API response
  useEffect(() => {
    if (profile) {
      setLanguage(profile.preferred_language ?? '');
      setContactMethod((profile.preferred_contact_method as ContactMethod) ?? '');
    }
  }, [profile]);

  // ── Profile Mutation ─────────────────────────────────────────────────────
  const { mutate: saveProfile, isPending: isSavingProfile } = useMutation({
    mutationFn: (payload: UpdateClientProfilePayload) => profileService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      setProfileSuccessMsg('Communication preferences saved successfully.');
      setProfileErrorMsg(null);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save communication preferences.';
      setProfileErrorMsg(msg);
      setProfileSuccessMsg(null);
    },
  });

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    const payload: UpdateClientProfilePayload = {
      preferred_language: language.trim() || null,
      preferred_contact_method: (contactMethod as ContactMethod) || null,
    };
    saveProfile(payload);
  };

  // ── Notification form state ──────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotificationPreferences>({
    appointment_reminders: true,
    invoice_alerts: true,
    pet_health_updates: true,
    marketing_updates: false,
  });

  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);
  const [notifErrorMsg, setNotifErrorMsg]     = useState<string | null>(null);

  // Sync notifs from API response
  useEffect(() => {
    if (notifData) {
      setNotifs(notifData);
    }
  }, [notifData]);

  // ── Notification Mutation ────────────────────────────────────────────────
  const { mutate: saveNotifs, isPending: isSavingNotifs } = useMutation({
    mutationFn: (payload: NotificationPreferences) => notificationService.updatePreferences(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationPreferences'], data);
      setNotifSuccessMsg('Notification preferences saved successfully.');
      setNotifErrorMsg(null);
      setTimeout(() => setNotifSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save notification preferences.';
      setNotifErrorMsg(msg);
      setNotifSuccessMsg(null);
    },
  });

  const handleNotifSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNotifErrorMsg(null);
    saveNotifs(notifs);
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

        {/* ── Communication Preferences ────────────────────────────────── */}
        <SectionCard title="Communication Preferences" icon={MessageSquare}>
          {profileSuccessMsg && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-teal-700/50 bg-teal-900/30 px-4 py-3 text-teal-300">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{profileSuccessMsg}</span>
            </div>
          )}
          {profileErrorMsg && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{profileErrorMsg}</span>
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                  disabled={isSavingProfile}
                  className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </FieldRow>
            <FieldRow
              label="Preferred Contact Method"
              description="How you'd like us to reach you for updates and reminders."
            >
              <div className="flex flex-wrap gap-3">
                {CONTACT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    disabled={isSavingProfile}
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
            <div className="border-t border-slate-700/50 pt-5">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? (
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

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <SectionCard title="Notifications" icon={Bell}>
          {notifSuccessMsg && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-teal-700/50 bg-teal-900/30 px-4 py-3 text-teal-300">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{notifSuccessMsg}</span>
            </div>
          )}
          {notifErrorMsg && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{notifErrorMsg}</span>
            </div>
          )}
          <form onSubmit={handleNotifSubmit} className="space-y-4">
            {[
              { key: 'appointment_reminders', label: 'Appointment Reminders', description: 'Receive reminders before scheduled appointments.' },
              { key: 'invoice_alerts', label: 'Invoice Alerts', description: 'Get notified when a new invoice is issued.' },
              { key: 'pet_health_updates', label: 'Pet Health Updates', description: 'Receive notifications about vaccination due dates.' },
              { key: 'marketing_updates', label: 'Marketing Updates', description: 'Receive newsletters and promotional offers.' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">{label}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
                <Toggle
                  checked={notifs[key as keyof NotificationPreferences]}
                  onChange={() => setNotifs(prev => ({ ...prev, [key]: !prev[key as keyof NotificationPreferences] }))}
                  disabled={isSavingNotifs}
                />
              </div>
            ))}
            <div className="border-t border-slate-700/50 pt-5 mt-2">
              <button
                type="submit"
                disabled={isSavingNotifs}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNotifs ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Notifications
                  </>
                )}
              </button>
            </div>
          </form>
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
