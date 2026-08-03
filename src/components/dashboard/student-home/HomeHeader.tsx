'use client';

import Image from 'next/image';
import HeaderCard from '@/components/dashboard/HeaderCard';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <HeaderCard
      title={`Halo, ${firstName}! 👋`}
      subtitle="Semangat belajar hari ini!"
      gradientFrom="#0077FF"
      gradientTo="#0066FF"
      className="px-6 sm:px-6"
      rightContent={
        <Image
          src={avatarAsset}
          alt={`${firstName} avatar`}
          width={96}
          height={96}
          sizes="(max-width: 640px) 80px, 96px"
          className="ml-4 h-20 w-20 object-contain sm:ml-6 sm:h-24 sm:w-24"
        />
      }
    />
  );
}
