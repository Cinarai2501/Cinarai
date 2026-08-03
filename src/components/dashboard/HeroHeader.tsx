'use client';

import type { ReactNode } from 'react';

type HeroHeaderProps = {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  rightContent: ReactNode;
};

export default function HeroHeader({
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  rightContent,
}: HeroHeaderProps) {
  return (
    <section
      className="mx-auto mb-5 flex h-[140px] w-full max-w-[1200px] items-center justify-between overflow-hidden rounded-[32px] px-4 py-4 text-white shadow-md sm:px-5 lg:px-6"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
      }}
    >
      <div className="flex-1 pr-4">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/90">
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-center">{rightContent}</div>
    </section>
  );
}
