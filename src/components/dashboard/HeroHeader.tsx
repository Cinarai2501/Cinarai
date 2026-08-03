'use client';

import type { ReactNode } from 'react';

type HeroHeaderProps = {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  rightContent: ReactNode;
  className?: string;
};

export default function HeroHeader({
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  rightContent,
  className = '',
}: HeroHeaderProps) {
  return (
    <section
      className={`relative mb-5 flex min-h-[144px] w-full items-center justify-between overflow-hidden rounded-b-[32px] px-5 py-5 pb-14 text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:px-6 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
      }}
    >
      <div className="flex-1 pr-4">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-white/90">
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-center">{rightContent}</div>
    </section>
  );
}
