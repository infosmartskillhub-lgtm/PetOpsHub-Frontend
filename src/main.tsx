// src/main.tsx
// Application entry point.
//
// Provider hierarchy (outer → inner):
//   StrictMode
//     QueryClientProvider (TanStack Query — for data fetching in future modules)
//       AuthInitializer (rehydrates Supabase session before first render)
//         App (router + routes)
//
// AuthInitializer calls authStore.initialize() once on mount. It renders a
// full-screen spinner until initialization completes, preventing a flash of
// the login page for already-authenticated users.

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import App from './App';
import './index.css';

// ─── TanStack Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once on failure before showing an error.
      retry: 1,
      // Consider data fresh for 30 seconds.
      staleTime: 30_000,
    },
  },
});

// ─── Auth Initializer ─────────────────────────────────────────────────────────
// Waits for the Supabase session to be rehydrated before rendering routes.
// This prevents ProtectedRoute from briefly redirecting authenticated users to /login.
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().finally(() => setReady(true));
  }, [initialize]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Root Render ──────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </QueryClientProvider>
  </StrictMode>
);
