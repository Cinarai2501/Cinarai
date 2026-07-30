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
    <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]" style={{ minHeight: 180 }}>
      <div className="flex items-start justify-between gap-[10px]">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Badge Terbaru</p>
          <p className="mt-[2px] text-[12px] font-medium text-[#6B7280]">Pencapaian terbaru kamu</p>
        </div>
        <Link href="/dashboard/siswa/profil" className="shrink-0 rounded-full border border-[#DCE8F8] bg-white px-[12px] py-[8px] text-[11px] font-semibold text-[#1D93FF] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
          Lihat Semua
        </Link>
      </div>
      <div className="mt-[12px] flex gap-[10px] overflow-x-auto pb-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {badgeItems.map((badge) => (
          <div key={badge.title} className="flex min-w-[104px] shrink-0 flex-col items-center rounded-[24px] border border-[#E5E7EB] bg-white p-[10px] shadow-sm">
            <div className="flex h-[96px] w-[96px] items-center justify-center rounded-[22px] bg-[#EFF6FF] p-[10px]">
              <Image src={badge.asset} alt={badge.title} width={96} height={96} className="h-[96px] w-[96px] object-contain" />
            </div>
            <p className="text-center text-[12px] font-semibold leading-[16px] text-[#111827]">{badge.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
