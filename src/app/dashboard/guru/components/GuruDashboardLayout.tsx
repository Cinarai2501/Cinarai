'use client';

import type { ReactNode } from 'react';

type GuruDashboardLayoutProps = {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

export function GuruDashboardLayout({ header, sidebar, children }: GuruDashboardLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        <div className="lg:sticky lg:top-6 lg:self-start">{sidebar}</div>
        <div className="space-y-6">
          {header}
          {children}
        </div>
      </div>
    </div>
  );
}
