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
      className="!min-h-[124px] rounded-b-[24px] px-0 py-3 pb-8 sm:px-0"
      rightContent={
        <Image
          src={avatarAsset}
          alt={`${firstName} avatar`}
          width={56}
          height={56}
          sizes="(max-width: 640px) 56px, 56px"
          className="ml-3 h-14 w-14 object-contain sm:ml-4"
        />
      }
    />
  );
}
