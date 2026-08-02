'use client';

import Image from 'next/image';
import Link from 'next/link';

type ContinueLearningCardProps = {
  coverAsset: string;
  title: string;
  progressPct: number;
};

export default function ContinueLearningCard({ coverAsset, title, progressPct }: ContinueLearningCardProps) {
  return (
    <section className="relative rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100">
      <div className="flex items-center gap-3.5">
        <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-100">
          <Image
            src={coverAsset}
            alt={title}
            width={84}
            height={84}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0066FF] tracking-wide uppercase">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
            </svg>
            <span>Lanjutkan Belajar</span>
          </div>

          <h2 className="mt-1 text-[15px] font-bold leading-snug text-slate-900 line-clamp-1">
            {title}
          </h2>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-[#0066FF]">{progressPct}%</span>
          </div>

          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0077FF] to-[#0055FF]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="mt-1.5 text-[11px] font-medium text-slate-500">
            4 dari 8 tahap selesai
          </p>
        </div>

        <Link
          href="/dashboard/siswa/komik"
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Lanjutkan belajar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
