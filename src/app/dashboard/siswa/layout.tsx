'use client';

import type { ReactNode } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

export default function DashboardSiswaLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-[#f5f9ff] text-neutral-900" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <main className="mx-auto min-h-screen max-w-[440px] px-0 pb-[96px] pt-1">{children}</main>
        <StudentBottomNav />
      </div>
    </RoleProtectedRoute>
  );
}
