'use client';

import Image from 'next/image';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <section
      className="w-full overflow-hidden rounded-b-[32px] px-5 pt-6 pb-12 text-white shadow-[0_12px_32px_rgba(15,23,42,0.10)] min-h-[320px]"
      style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 320 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-start">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">Selamat Datang</p>
          <h1 className="mt-1 text-[32px] font-bold leading-tight text-white">Halo, {firstName}!</h1>
          <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/90">Semangat belajar hari ini!</p>
        </div>
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/20 ring-[2px] ring-white/70">
          <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
        </div>
      </div>
    </section>
  );
}
