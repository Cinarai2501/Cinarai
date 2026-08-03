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
    <section className="soft-card rounded-[24px] p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-[#0066FF]">
          Badge Terbaru
        </h3>
        <Link
          href="/dashboard/siswa/profil"
          className="text-[11px] font-bold text-[#0066FF] hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {badgeItems.map((badge) => (
          <div
            key={badge.title}
            className="flex min-w-[64px] flex-col items-center justify-center gap-1 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105">
              <Image
                src={badge.asset}
                alt={badge.title}
                width={56}
                height={56}
                className="h-[56px] w-[56px] object-contain"
              />
            </div>
            <span className="text-[10px] font-bold leading-tight text-slate-800 line-clamp-2">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
