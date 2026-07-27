'use client';

import type { ReactNode } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

export default function DashboardSiswaLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-[#f0f7ff] text-neutral-900" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <main className="mx-auto min-h-screen max-w-lg px-3 pb-28 pt-0">{children}</main>
        <StudentBottomNav />
      </div>
    </RoleProtectedRoute>
  );
}
