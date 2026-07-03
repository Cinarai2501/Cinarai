'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole: _requiredRole,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary-500 to-primary-600">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-lg">
          🎓
        </div>
        <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
        <p className="text-sm font-semibold text-primary-100">Memuat petualangan...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
};
