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

      <div className="mt-2 grid grid-cols-3 gap-2">
        {badgeItems.map((badge) => (
          <div
            key={badge.title}
            className="flex min-h-[116px] flex-col items-center justify-start gap-2 text-center"
          >
            <div className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-[20px] bg-white p-0 transition-transform hover:scale-105">
              <Image
                src={badge.asset}
                alt={badge.title}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="flex min-h-[28px] items-center justify-center text-[10px] font-bold leading-3 text-slate-800 line-clamp-2">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
