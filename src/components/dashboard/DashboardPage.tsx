'use client';

import type { ReactNode } from 'react';
import HeaderCard from './HeaderCard';

type DashboardPageProps = {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  rightContent: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function DashboardPage({
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  rightContent,
  children,
  className = '',
}: DashboardPageProps) {
  return (
    <div className={`min-h-0 w-full bg-[linear-gradient(180deg,#F5F8FF_0%,#F8FAFF_100%)] text-neutral-900 ${className}`}>
      <HeaderCard
        title={title}
        subtitle={subtitle}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        rightContent={rightContent}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-2 pt-5 sm:px-5 lg:px-6">
        {children}
      </div>
    </div>
  );
}
