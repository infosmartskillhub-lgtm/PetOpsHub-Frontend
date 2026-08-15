// src/features/auth/pages/LoginPage.tsx
// Public login page for the PetOpsHub Client Portal.
//
// Auth flow:
//   1. User submits email + password.
//   2. useAuth().login() calls supabase.auth.signInWithPassword → then GET /auth/me.
//   3. On success → navigate to location.state?.from.pathname ?? '/dashboard'
//      (ProtectedRoute passes { from: location } in state so we land back where
//       the user originally wanted to go).
//   4. On failure → authStore throws; we catch it and show the error message.
//
// Design conventions match the rest of the portal:
//   - bg-slate-900 base, bg-slate-800/80 card, border-slate-800
//   - teal-500/600 accent, lucide-react icons

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PawPrint, Mail, Lock, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // ProtectedRoute stores the originally requested path as state.from.
  // Fall back to /dashboard when no prior destination is recorded.
  const from =
    (location.state as { from?: { pathname: string } } | null)
      ?.from?.pathname ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* ── Brand mark ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/20 ring-2 ring-teal-500/30">
            <PawPrint className="h-8 w-8 text-teal-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">PetOpsHub</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to your client portal</p>
          </div>
        </div>

        {/* ── Login card ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-800 bg-red-900/50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};
