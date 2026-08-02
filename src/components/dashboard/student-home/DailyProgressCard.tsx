'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  nextStageLabel: string;
};

export default function DailyProgressCard({ progressPct }: DailyProgressCardProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100 space-y-3">
      <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-[#00AA55]">
        Progres Belajar Hari Ini
      </h3>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[26px] font-extrabold leading-none text-slate-900">
          {progressPct}%
        </span>
        <span className="text-[12px] font-medium text-slate-500">
          4 dari 8 tahap selesai
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0077FF] to-[#0055FF] transition-all duration-500"
          style={{ width: `${Math.max(5, progressPct)}%` }}
        />
      </div>

      <Link
        href="/dashboard/siswa/komik"
        className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Lihat Detail Tahap</span>
        </div>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </section>
  );
}
