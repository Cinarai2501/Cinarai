'use client';

import type { ReactNode } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

export default function DashboardSiswaLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRole="student">
      <div className="flex min-h-screen justify-center bg-slate-100">
        <div
          className="relative min-h-screen w-full max-w-[480px] overflow-hidden text-neutral-900 shadow-2xl bg-white"
          style={{
            background: '#F5F8FD',
            paddingTop: 'max(0px, env(safe-area-inset-top))',
          }}
        >
          {/* ── Blur blobs — z-0 ── */}
          {/* Blue */}
        <div
          className="pointer-events-none absolute -right-[120px] -top-[100px] z-0 h-[420px] w-[420px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #A5D8FF 0%, transparent 65%)',
            filter: 'blur(140px)',
            opacity: 0.05,
          }}
        />
        {/* Green */}
        <div
          className="pointer-events-none absolute -left-[100px] top-[38%] z-0 h-[340px] w-[340px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #B7F7C4 0%, transparent 65%)',
            filter: 'blur(130px)',
            opacity: 0.05,
          }}
        />
        {/* Yellow */}
        <div
          className="pointer-events-none absolute -right-[80px] bottom-[20%] z-0 h-[300px] w-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #FFE8A3 0%, transparent 65%)',
            filter: 'blur(120px)',
            opacity: 0.06,
          }}
        />

        {/* ── Decorative watermarks — educational theme, opacity 2–3% ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
          style={{ opacity: 0.025 }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 390 844"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* ── Clouds ── */}
            <ellipse cx="60"  cy="80"  rx="52" ry="22" fill="#1D4ED8" />
            <ellipse cx="90"  cy="68"  rx="36" ry="18" fill="#1D4ED8" />
            <ellipse cx="30"  cy="72"  rx="28" ry="14" fill="#1D4ED8" />

            <ellipse cx="320" cy="140" rx="48" ry="20" fill="#1D4ED8" />
            <ellipse cx="348" cy="128" rx="32" ry="16" fill="#1D4ED8" />
            <ellipse cx="294" cy="132" rx="26" ry="13" fill="#1D4ED8" />

            <ellipse cx="180" cy="50"  rx="38" ry="16" fill="#1D4ED8" />
            <ellipse cx="204" cy="40"  rx="26" ry="13" fill="#1D4ED8" />

            {/* ── Stars ── */}
            <polygon points="340,30 343,22 346,30 354,30 348,35 350,43 343,38 336,43 338,35 332,30" fill="#1D4ED8" />
            <polygon points="20,200 22,194 24,200 30,200 25,204 27,210 22,206 17,210 19,204 14,200" fill="#1D4ED8" />
            <polygon points="370,320 372,314 374,320 380,320 375,324 377,330 372,326 367,330 369,324 364,320" fill="#1D4ED8" />
            <polygon points="10,500 12,494 14,500 20,500 15,504 17,510 12,506 7,510 9,504 4,500" fill="#1D4ED8" />

            {/* ── Rolling hills ── */}
            <path
              d="M0 760 Q60 700 130 730 Q200 760 270 710 Q340 660 390 700 L390 844 L0 844 Z"
              fill="#1D4ED8"
            />

            {/* ── Candi Penataran silhouette ── */}
            <g transform="translate(100, 560)">
              <rect x="85"  y="0"   width="22" height="10" rx="2" fill="#1D4ED8" />
              <rect x="78"  y="10"  width="36" height="9"  rx="2" fill="#1D4ED8" />
              <rect x="70"  y="19"  width="52" height="9"  rx="2" fill="#1D4ED8" />
              <rect x="60"  y="28"  width="72" height="9"  rx="2" fill="#1D4ED8" />
              <rect x="48"  y="37"  width="96" height="10" rx="2" fill="#1D4ED8" />
              <rect x="34"  y="47"  width="124" height="11" rx="2" fill="#1D4ED8" />
              <rect x="18"  y="58"  width="156" height="12" rx="2" fill="#1D4ED8" />
              <rect x="0"   y="70"  width="192" height="14" rx="2" fill="#1D4ED8" />
              {/* spire */}
              <rect x="90"  y="-8"  width="12" height="10" rx="2" fill="#1D4ED8" />
              <rect x="93"  y="-14" width="6"  height="8"  rx="2" fill="#1D4ED8" />
            </g>

            {/* ── Small leaves ── */}
            <ellipse cx="355" cy="600" rx="14" ry="8"  transform="rotate(-30 355 600)" fill="#1D4ED8" />
            <ellipse cx="365" cy="592" rx="12" ry="7"  transform="rotate(20 365 592)"  fill="#1D4ED8" />
            <ellipse cx="25"  cy="680" rx="16" ry="9"  transform="rotate(25 25 680)"   fill="#1D4ED8" />
            <ellipse cx="15"  cy="670" rx="13" ry="7"  transform="rotate(-20 15 670)"  fill="#1D4ED8" />
          </svg>
        </div>

        <main className="relative z-10 min-h-[calc(100dvh-112px)] w-full px-0 pb-[112px] pt-1">{children}</main>
        <StudentBottomNav />
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
