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
    <section className="rounded-3xl bg-[#F6F9FE] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] min-h-[220px]" style={{ minHeight: 220 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Badge Terbaru</p>
          <p className="mt-1 text-[14px] font-medium text-[#6B7280]">Pencapaian terbaru kamu</p>
        </div>
        <Link href="/dashboard/siswa/profil" className="shrink-0 rounded-full border border-[#DCE8F8] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#1D93FF] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
          Lihat Semua
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {badgeItems.slice(0, 2).map((badge) => (
          <div key={badge.title} className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#EFF6FF] p-1">
              <Image src={badge.asset} alt={badge.title} width={56} height={56} className="h-[56px] w-[56px] object-contain" />
            </div>
            <p className="mt-2 text-center text-[12px] font-semibold leading-tight text-[#111827]">{badge.title}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <a href="/dashboard/siswa/profil" className="text-[14px] font-semibold text-[#1D93FF]">Lihat Semua</a>
      </div>
    </section>
  );
}
