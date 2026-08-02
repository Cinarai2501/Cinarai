'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  stageLabel: string;
  nextStageLabel: string;
};

export default function DailyProgressCard({ progressPct, stageLabel }: DailyProgressCardProps) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#1D93FF]">
        PROGRES BELAJAR HARI INI
      </h3>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[32px] font-bold text-[#1D93FF] leading-none">{progressPct}%</span>
        <span className="text-[13px] font-medium text-[#6B7280]">{stageLabel}</span>
      </div>

      <div className="mt-3 h-[10px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
        <div
          className="h-full rounded-full bg-[#1D93FF] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(6, progressPct)}%` }}
        />
      </div>

      <Link
        href="/dashboard/siswa/komik"
        className="mt-3.5 flex items-center justify-between rounded-2xl border border-[#EEF4FB] bg-[#FAFCFF] p-3 text-[14px] font-semibold text-[#334155] transition-colors hover:bg-[#EEF7FF]"
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#1D93FF]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Lihat Detail Tahap</span>
        </div>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </section>
  );
}
