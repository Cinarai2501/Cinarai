'use client';

import type { ReactNode } from 'react';

interface LearningContentProps {
  children: ReactNode;
}

export default function LearningContent({ children }: LearningContentProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#f0f7ff]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 animate-fade-in">
        {children}
      </div>
    </main>
  );
}
