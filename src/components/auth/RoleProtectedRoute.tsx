'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedDashboardPath } from '@/lib/auth/redirects';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'student' | 'teacher' | 'admin';
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const route = typeof window !== 'undefined' ? window.location.pathname : '/';

    if (typeof window !== 'undefined') {
      window.__cinaraiAuthDebug = {
        ...(window.__cinaraiAuthDebug ?? {}),
        route,
        role: user?.role ?? 'unknown',
        uid: user?.uid ?? 'anonymous',
      };
    }

    // debug context is stored on window for development inspection

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role !== allowedRole) {
      router.replace(getRoleBasedDashboardPath(user.role));
    }
  }, [allowedRole, loading, router, user]);

  if (loading || !user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
