'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="w-full overflow-hidden rounded-b-[36px] px-[20px] pb-[18px] pt-[18px] text-white shadow-[0_16px_30px_rgba(15,23,42,0.16)]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 240 }}
    >
      <div className="flex items-start justify-between gap-[16px]">
        <div className="flex min-w-0 flex-1 flex-col justify-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">Selamat Datang</p>
          <h1 className="mt-[8px] text-[28px] font-extrabold leading-[34px] text-white">Halo, {firstName}!</h1>
          <p className="mt-[4px] text-[14px] font-normal leading-[20px] text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="mt-[2px] flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/20 ring-[3px] ring-white/70">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
