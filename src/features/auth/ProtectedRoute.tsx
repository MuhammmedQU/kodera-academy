import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/app/AuthContext';

export function RequireActiveStudent({ children }: { children: ReactNode }) {
  const { user, isLoading, justLoggedOut } = useAuth();
  const location = useLocation();
  const fullPath = `${location.pathname}${location.search}${location.hash}`;

  if (isLoading) {
    return <Spinner fullPage label="Giriş icazəsi yoxlanılır..." />;
  }

  if (!user) {
    if (justLoggedOut) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" state={{ from: fullPath }} replace />;
  }

  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!user.isActiveStudent) {
    return <Navigate to="/application-status" replace />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, justLoggedOut } = useAuth();
  const location = useLocation();
  const fullPath = `${location.pathname}${location.search}${location.hash}`;

  if (isLoading) {
    return <Spinner fullPage label="Admin səlahiyyəti yoxlanılır..." />;
  }

  if (!user) {
    if (justLoggedOut) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/admin/login" state={{ from: fullPath }} replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to={user.isActiveStudent ? '/dashboard' : '/application-status'} replace />;
  }

  return <>{children}</>;
}
