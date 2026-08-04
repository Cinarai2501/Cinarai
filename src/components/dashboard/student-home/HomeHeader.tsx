'use client';

import Image from 'next/image';
import HeaderCard from '@/components/dashboard/HeaderCard';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section className="relative min-h-[176px] w-full overflow-hidden rounded-b-[24px] bg-gradient-to-br from-[#1D93FF] to-[#0F5FB5] px-[16px] pb-[20px] pt-[env(safe-area-inset-top)] text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]" style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)' }}>
      <div className="flex h-full items-start justify-between gap-[16px] pt-[16px]">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.20em] text-white/85">Selamat Datang</p>
          <h1 className="mt-[4px] text-[clamp(20px,5vw,26px)] font-extrabold leading-[1.05] text-white">Halo, {firstName}!</h1>
          <p className="mt-[4px] text-[clamp(10px,2.5vw,12px)] font-medium text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_10px_25px_rgba(15,23,42,0.14)] ring-[3px] ring-white/100">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-full w-full rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
