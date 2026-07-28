'use client';

import type { ReactNode } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

export default function DashboardSiswaLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRole="student">
      <div
        className="relative min-h-screen overflow-hidden text-neutral-900"
        style={{
          background: 'linear-gradient(180deg, #F0F7FF 0%, #EAF3FF 30%, #F5F9FF 65%, #FFFFFF 100%)',
          paddingTop: 'max(0px, env(safe-area-inset-top))',
        }}
      >
        {/* ── decorative blobs — z-0 ── */}
        <div
          className="pointer-events-none absolute -right-[100px] -top-[80px] z-0 h-[380px] w-[380px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(29,147,255,0.08) 0%, transparent 68%)',
            filter: 'blur(130px)',
          }}
        />
        <div
          className="pointer-events-none absolute -left-[80px] top-[35%] z-0 h-[300px] w-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 68%)',
            filter: 'blur(120px)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-[60px] bottom-[18%] z-0 h-[260px] w-[260px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 68%)',
            filter: 'blur(110px)',
          }}
        />

        {/* ── Candi Penataran motif — SVG silhouette, opacity 2.5% ── */}
        <div
          className="pointer-events-none absolute bottom-[80px] left-1/2 z-0 -translate-x-1/2"
          style={{ opacity: 0.025 }}
          aria-hidden="true"
        >
          <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* simplified candi silhouette — stacked temple tiers */}
            <rect x="140" y="10" width="40" height="16" rx="3" fill="#1D4ED8"/>
            <rect x="128" y="26" width="64" height="14" rx="3" fill="#1D4ED8"/>
            <rect x="114" y="40" width="92" height="14" rx="3" fill="#1D4ED8"/>
            <rect x="100" y="54" width="120" height="14" rx="3" fill="#1D4ED8"/>
            <rect x="86" y="68" width="148" height="16" rx="3" fill="#1D4ED8"/>
            <rect x="72" y="84" width="176" height="18" rx="3" fill="#1D4ED8"/>
            <rect x="58" y="102" width="204" height="20" rx="3" fill="#1D4ED8"/>
            <rect x="40" y="122" width="240" height="22" rx="3" fill="#1D4ED8"/>
            <rect x="20" y="144" width="280" height="24" rx="3" fill="#1D4ED8"/>
            <rect x="0"  y="168" width="320" height="32" rx="4" fill="#1D4ED8"/>
            {/* decorative notches */}
            <rect x="148" y="4"  width="24" height="8"  rx="2" fill="#1D4ED8"/>
            <rect x="154" y="0"  width="12" height="6"  rx="2" fill="#1D4ED8"/>
          </svg>
        </div>

        {/* all page content above decorations */}
        <main className="relative z-10 min-h-screen w-full px-0 pb-[96px] pt-1">{children}</main>
        <StudentBottomNav />
      </div>
    </RoleProtectedRoute>
  );
}
