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

        {/* Header */}
        {/* gunakan layout LearningJourney */}

        {/* tampilkan nama user */}
        {user?.displayName}

        {/* tombol Logout */}
        <button onClick={handleLogout}>
          Logout
        </button>

        <LearningJourney />

      </main>
    </ProtectedRoute>
  );
}