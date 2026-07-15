'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedDashboardPath } from '@/lib/auth/redirects';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'student' | 'teacher' | 'admin';
}

function roleToDashboard(role: string): string {
  return getRoleBasedDashboardPath(role as 'student' | 'teacher' | 'admin');
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

    console.info('[RoleProtectedRoute]', {
      uid: user?.uid ?? 'anonymous',
      role: user?.role ?? 'unknown',
      route,
      allowedRole,
    });

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role !== allowedRole) {
      router.replace(roleToDashboard(user.role));
    }
  }, [allowedRole, loading, router, user]);

  if (loading || !user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
