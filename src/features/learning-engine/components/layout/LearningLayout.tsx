'use client';

import type { ReactNode } from 'react';
import LearningHeader from './LearningHeader';
import LearningProgress from './LearningProgress';
import LearningContent from './LearningContent';
import LearningBottomNav from './LearningBottomNav';
import LearningStageNav from './LearningStageNav';

interface LearningLayoutProps {
  children: ReactNode;
}

export default function LearningLayout({ children }: LearningLayoutProps) {
  return (
    <div
      className="flex flex-col bg-[#f0f7ff]"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* ── Top chrome: header + progress ── */}
      <div className="flex-shrink-0">
        <LearningHeader />
        <LearningProgress />
      </div>

      {/* ── Body: sidebar (lg+) + scrollable content ── */}
      <div className="flex flex-1 min-h-0 mx-auto w-full max-w-[1400px]">

        {/* Sidebar stage nav — only on lg+ */}
        <aside className="hidden lg:flex flex-shrink-0 w-64 xl:w-72 flex-col border-r border-neutral-200 bg-white overflow-y-auto">
          <LearningStageNav />
        </aside>

        {/* Main scrollable content */}
        <div className="flex flex-col flex-1 min-w-0">
          <LearningContent>{children}</LearningContent>
          <LearningBottomNav />
        </div>
      </div>
    </div>
  );
}
