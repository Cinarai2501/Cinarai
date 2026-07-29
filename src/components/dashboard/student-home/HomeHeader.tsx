'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="overflow-hidden rounded-[32px] px-[24px] pb-[72px] pt-[24px] text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 200 }}
    >
      <div className="flex h-full items-start justify-between gap-[16px]">
        <div className="flex min-w-0 flex-1 flex-col justify-center pt-[2px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">Selamat Datang</p>
          <h1 className="mt-[8px] text-[42px] font-bold leading-[44px] text-white">Halo, {firstName}!</h1>
          <p className="mt-[8px] text-[18px] font-normal text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center self-center rounded-full bg-white/20 ring-[3px] ring-white/70">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={88} height={88} className="h-[88px] w-[88px] rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
