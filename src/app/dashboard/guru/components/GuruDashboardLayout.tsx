'use client';

import type { ReactNode } from 'react';

type GuruDashboardLayoutProps = {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

export function GuruDashboardLayout({ header, sidebar, children }: GuruDashboardLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <div className="mb-4 lg:sticky lg:top-6 lg:mb-0 lg:self-start">{sidebar}</div>
        <div className="space-y-4">
          {header}
          {children}
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-20 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30">
        + Baru
      </div>
    </div>
  );
}
