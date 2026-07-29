'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="overflow-hidden rounded-[36px] px-[20px] pb-[24px] pt-[20px] text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 320 }}
    >
      <div className="flex h-full flex-col justify-between gap-[16px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">Selamat Datang</p>
            <h1 className="mt-[6px] text-[28px] font-extrabold leading-[34px] text-white">Halo, {firstName}!</h1>
            <p className="mt-[8px] text-[14px] font-normal text-white/90">Semangat belajar hari ini!</p>
          </div>
          <div className="relative mt-[2px] flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/20 ring-[3px] ring-white/70">
            <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
