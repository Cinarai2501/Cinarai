'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="relative flex min-h-[144px] w-full items-center justify-between overflow-hidden rounded-b-[32px] px-4 py-5 pb-14 text-white shadow-[0_10px_30px_rgba(37,99,235,0.12)] sm:px-4"
      style={{ background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)' }}
    >
      <div className="flex-1 pr-3 sm:pr-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.20em] text-white/85">Selamat Datang</p>
        <h1 className="mt-[4px] text-[clamp(20px,5vw,26px)] font-extrabold leading-[1.05] text-white">
          Halo, {firstName}!
        </h1>
        <p className="mt-[4px] text-[clamp(10px,2.5vw,12px)] font-medium leading-relaxed text-white/90">
          Semangat belajar hari ini!
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-center">
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 ring-2 ring-white/50 shadow-md backdrop-blur-sm">
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <Image
              src={avatarAsset}
              alt={`${firstName} avatar`}
              fill
              sizes="68px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
