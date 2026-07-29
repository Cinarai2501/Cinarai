'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="overflow-hidden rounded-[20px] px-[24px] py-[24px] text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 240 }}
    >
      <div className="flex items-start justify-between gap-[16px]">
        <div className="flex min-w-0 flex-1 flex-col justify-start pt-[2px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">Selamat Datang</p>
          <h1 className="mt-[8px] text-[32px] font-bold leading-[38px] text-white">Halo, {firstName}!</h1>
          <p className="mt-[8px] text-[18px] font-normal leading-[24px] text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="mr-[24px] flex h-[64px] w-[64px] shrink-0 items-center justify-center self-start rounded-full bg-white/10">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={64} height={64} className="h-[64px] w-[64px] rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
