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
    <section className="rounded-[26px] bg-[#F6F9FE] p-[12px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]" style={{ minHeight: 128 }}>
      <div className="flex items-start justify-between gap-[8px]">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">Badge Terbaru</p>
          <p className="mt-[2px] text-[10px] font-medium text-[#6B7280]">Pencapaian terbaru kamu</p>
        </div>
        <Link href="/dashboard/siswa/profil" className="shrink-0 rounded-full border border-[#DCE8F8] bg-white px-[10px] py-[6px] text-[10px] font-semibold text-[#1D93FF] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
          Lihat Semua
        </Link>
      </div>
      <div className="mt-[8px] grid grid-cols-2 gap-[8px]">
        {badgeItems.slice(0, 2).map((badge) => (
          <div key={badge.title} className="flex flex-col items-center rounded-[20px] border border-[#E5E7EB] bg-white p-[8px] shadow-sm">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[#EFF6FF] p-[5px]">
              <Image src={badge.asset} alt={badge.title} width={52} height={52} className="h-[52px] w-[52px] object-contain" />
            </div>
            <p className="mt-[5px] text-center text-[10px] font-semibold leading-[13px] text-[#111827]">{badge.title}</p>
          </div>
        ))}
      </div>
      <div className="mt-[8px] flex justify-end">
        <a href="/dashboard/siswa/profil" className="text-[10px] font-semibold text-[#1D93FF]">Lihat Semua</a>
      </div>
    </section>
  );
}
