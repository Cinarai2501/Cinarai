'use client';

import Image from 'next/image';
import HeroHeader from '@/components/dashboard/HeroHeader';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <HeroHeader
      title={`Halo, ${firstName}! 👋`}
      subtitle="Semangat belajar hari ini!"
      gradientFrom="#0077FF"
      gradientTo="#0066FF"
      rightContent={
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 ring-2 ring-white/50 shadow-md backdrop-blur-sm">
          <Image
            src={avatarAsset}
            alt={`${firstName} avatar`}
            width={64}
            height={64}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      }
    />
  );
}
