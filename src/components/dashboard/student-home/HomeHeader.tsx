'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section className="relative w-full rounded-b-[32px] bg-gradient-to-b from-[#0077FF] to-[#0066FF] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-14 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-white flex items-center gap-1.5">
            Halo, {firstName}! 👋
          </h1>
          <p className="mt-1 text-[13px] font-medium text-white/90">
            Semangat belajar hari ini!
          </p>
        </div>
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 ring-2 ring-white/50 backdrop-blur-sm shadow-md">
          <Image
            src={avatarAsset}
            alt={`${firstName} avatar`}
            width={56}
            height={56}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
