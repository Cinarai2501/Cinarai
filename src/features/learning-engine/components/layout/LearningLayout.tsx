'use client';

import type { ReactNode } from 'react';
import LearningHeader from './LearningHeader';
import LearningProgress from './LearningProgress';
import LearningBreadcrumb from './LearningBreadcrumb';
import LearningContent from './LearningContent';
import LearningBottomNav from './LearningBottomNav';

interface LearningLayoutProps {
  children: ReactNode;
}

export default function LearningLayout({ children }: LearningLayoutProps) {
  return (
    <div
      className="flex flex-col bg-[#f0f7ff]"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Fixed top section */}
      <div className="flex-shrink-0">
        <LearningHeader />
        <LearningProgress />
        <LearningBreadcrumb />
      </div>

      {/* Scrollable content */}
      <LearningContent>{children}</LearningContent>

      {/* Fixed bottom navigation */}
      <LearningBottomNav />
    </div>
  );
}
