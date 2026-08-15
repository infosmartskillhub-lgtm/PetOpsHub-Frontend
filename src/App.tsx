// src/App.tsx
// Root router configuration for PetOpsHub Frontend.
//
// Route structure:
//   /login           → LoginPage (public)
//   /unauthorized    → 403 page (public)
//   /*               → ProtectedRoute wrapper
//       /dashboard      → DashboardPage (authenticated)
//       /pets           → MyPetsPage (authenticated)
//       /appointments   → AppointmentsPage (authenticated)
//       /               → redirect to /dashboard
//       *               → 404

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MyPetsPage } from '@/features/pets/pages/MyPetsPage';
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage';
import { InvoicesPage } from '@/features/billing/pages/InvoicesPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';

// ─── Minimal Utility Pages ────────────────────────────────────────────────────
const UnauthorizedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white flex-col gap-4">
    <h1 className="text-4xl font-bold text-red-400">403</h1>
    <p className="text-slate-400">You do not have permission to access this page.</p>
    <a href="/dashboard" className="text-teal-400 hover:underline text-sm">
      Return to Dashboard
    </a>
  </div>
);

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white flex-col gap-4">
    <h1 className="text-4xl font-bold text-slate-400">404</h1>
    <p className="text-slate-400">The page you are looking for does not exist.</p>
    <a href="/dashboard" className="text-teal-400 hover:underline text-sm">
      Return to Dashboard
    </a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public Routes ─────────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── Protected Routes (require authentication) ─────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pets" element={<MyPetsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
        </Route>

        {/* ── Catch-all 404 ─────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
