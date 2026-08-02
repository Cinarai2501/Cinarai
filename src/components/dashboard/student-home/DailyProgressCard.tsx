'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  stageLabel: string;
  nextStageLabel: string;
};

export default function DailyProgressCard({ progressPct, stageLabel, nextStageLabel }: DailyProgressCardProps) {
  return (
    <section className="rounded-3xl bg-[#FEFCFF] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] min-h-[160px]" style={{ minHeight: 160 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E0F2FE] text-[#1D93FF]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#1D93FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16" />
              <path d="M12 4v16" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Progress Belajar Hari Ini</p>
          </div>
        </div>
        <Link href="/dashboard/siswa/komik" className="rounded-full bg-[#1D93FF] px-3.5 py-1.5 text-[14px] font-semibold text-white">Lihat</Link>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-[#475569]">Kamu sudah menyelesaikan</p>
          <p className="mt-1 text-[32px] font-bold leading-none text-[#111827]">{progressPct}%</p>
          <p className="mt-1 text-[14px] font-medium text-[#6B7280]">{stageLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-medium text-[#6B7280]">Tahap berikutnya</p>
          <p className="mt-1 text-[14px] font-semibold text-[#111827]">{nextStageLabel}</p>
        </div>
      </div>
      <div className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5] transition-all duration-500 ease-out" style={{ width: `${Math.max(8, progressPct)}%` }} />
      </div>
    </section>
  );
}
