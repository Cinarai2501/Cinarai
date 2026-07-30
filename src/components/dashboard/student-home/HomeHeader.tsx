'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="w-full overflow-hidden rounded-b-[24px] px-[16px] pb-[10px] pt-[12px] text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 136 }}
    >
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-1 flex-col justify-start">
          <p className="text-[9px] font-semibold uppercase tracking-[0.20em] text-white/80">Selamat Datang</p>
          <h1 className="mt-[4px] text-[22px] font-extrabold leading-[28px] text-white">Halo, {firstName}!</h1>
          <p className="mt-[2px] text-[10px] font-medium leading-[13px] text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="mt-[1px] flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-white/20 ring-[2px] ring-white/70">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={48} height={48} className="h-[48px] w-[48px] rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
