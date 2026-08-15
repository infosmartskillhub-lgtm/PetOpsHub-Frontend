// src/hooks/useAuth.ts
// Convenience hook — re-exports the auth store with a stable selector.
// Components should use this hook rather than importing useAuthStore directly.
//
// Usage:
//   const { user, isAuthenticated, isLoading, login, logout } = useAuth();

import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';

export const useAuth = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      login: state.login,
      logout: state.logout,
    }))
  );
