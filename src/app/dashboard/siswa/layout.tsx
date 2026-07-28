'use client';

import type { ReactNode } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

export default function DashboardSiswaLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRole="student">
      <div
        className="min-h-screen text-neutral-900"
        style={{
          background: 'linear-gradient(180deg, #EAF3FF 0%, #F4F8FF 60%, #F4F8FF 100%)',
          paddingTop: 'max(0px, env(safe-area-inset-top))',
        }}
      >
        <main className="min-h-screen w-full px-0 pb-[96px] pt-1">{children}</main>
        <StudentBottomNav />
      </div>
    </RoleProtectedRoute>
  );
}
