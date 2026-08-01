// src/components/auth/ProtectedRoute.tsx
// Route guard component.
//
// Behaviour:
//   - isLoading  → renders a full-screen spinner (session rehydration in progress).
//   - !isAuthenticated → redirects to /login, preserving the original `from` location
//     so we can redirect back after successful login.
//   - isAuthenticated → renders children (the protected page).
//
// Optional `requiredRole` prop enforces RBAC at the route level.
// If the user's role does not match, they are redirected to /unauthorized.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  /** If provided, the user's role must match one of these values. */
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Session is still being rehydrated from localStorage — show spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login, preserving intended destination.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control check.
  if (requiredRoles && user?.role && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authenticated (and authorized) — render nested routes.
  return <Outlet />;
};
