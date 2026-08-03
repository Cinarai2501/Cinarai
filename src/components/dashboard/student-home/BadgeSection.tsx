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
    <section className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#0066FF]">
          Badge Terbaru
        </h3>
        <Link
          href="/dashboard/siswa/profil"
          className="text-[12px] font-bold text-[#0066FF] hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        {badgeItems.map((badge) => (
          <div
            key={badge.title}
            className="flex min-w-[76px] flex-col items-center justify-center gap-1.5 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center p-0.5 transition-transform hover:scale-105">
              <Image
                src={badge.asset}
                alt={badge.title}
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-[11px] font-bold leading-tight text-slate-800 line-clamp-2">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
