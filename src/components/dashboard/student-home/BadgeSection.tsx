'use client';

import Image from 'next/image';
import Link from 'next/link';

type BadgeItem = {
  asset: string;
  title: string;
};

type BadgeSectionProps = {
  badgeItems: BadgeItem[];
};

export default function BadgeSection({ badgeItems }: BadgeSectionProps) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#1D93FF]">
          BADGE TERBARU
        </h3>
        <Link href="/dashboard/siswa/profil" className="text-[13px] font-bold text-[#1D93FF] hover:underline">
          Lihat Semua
        </Link>
      </div>

      <div className="mt-3.5 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {badgeItems.map((badge) => (
          <div
            key={badge.title}
            className="flex w-[86px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#F1F5F9] bg-[#FAFCFF] p-2.5 shadow-sm"
          >
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-xl bg-white p-1 shadow-inner">
              <Image src={badge.asset} alt={badge.title} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
            </div>
            <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-[#111827] line-clamp-2">
              {badge.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
