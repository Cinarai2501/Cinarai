'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-neutral-50 px-4 py-5 text-neutral-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Selamat datang,</p>
              <h1 className="text-xl font-bold text-neutral-950">
                {user?.displayName ?? user?.email ?? 'Siswa'}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 shadow-sm hover:bg-neutral-50"
            >
              Keluar
            </button>
          </div>

          <LearningJourney />
        </div>
      </main>
    </ProtectedRoute>
  );
}
