'use client';

import HeaderCard from './HeaderCard';
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
    <HeaderCard
      title={title}
      subtitle={subtitle}
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
      rightContent={rightContent}
      className={className}
    />
  );
}
