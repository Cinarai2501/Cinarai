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
    <section className="soft-card relative overflow-hidden rounded-[24px] p-3 animate-[fadeInUp_0.45s_ease-out_both]">
      <div className="flex items-center gap-3">
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-100 shadow-sm">
          <Image
            src={coverAsset}
            alt={title}
            width={72}
            height={72}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0066FF]">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
            </svg>
            <span>Lanjutkan Belajar</span>
          </div>

          <h2 className="mt-1 text-[14px] font-bold leading-snug text-slate-900 line-clamp-2">
            {title}
          </h2>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-[#0066FF]">{progressPct}% selesai</span>
          </div>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0077FF] to-[#0055FF] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="mt-1 text-[11px] font-medium text-slate-500">
            4 dari 8 tahap selesai
          </p>
        </div>

        <Link
          href="/dashboard/siswa/komik"
          className="absolute right-3 top-1/2 flex h-[52px] w-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_20px_rgba(0,102,255,0.25)] transition-all duration-200 hover:scale-105 active:scale-95"
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
