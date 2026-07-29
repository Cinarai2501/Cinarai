'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  stageLabel: string;
};

export default function DailyProgressCard({ progressPct, stageLabel }: DailyProgressCardProps) {
  return (
    <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]" style={{ minHeight: 160 }}>
      <div className="flex items-start justify-between gap-[8px]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
          <p className="mt-[4px] text-[14px] font-medium text-[#6B7280]">Kamu sudah menyelesaikan {progressPct}% dari perjalanan hari ini.</p>
          <p className="mt-[4px] text-[12px] font-semibold text-[#1D93FF]">{stageLabel}</p>
        </div>
        <Link href="/dashboard/siswa/komik" className="flex h-[36px] items-center rounded-full bg-[#1D93FF] px-[12px] text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(29,147,255,0.24)]" aria-label="Lihat detail progres">
          Lihat
        </Link>
      </div>
      <div className="mt-[12px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${Math.max(8, progressPct)}%` }} />
      </div>
      <div className="mt-[12px] flex items-center justify-between text-[12px] font-semibold text-[#6B7280]">
        <span>Mulai</span>
        <span>{progressPct}%</span>
        <span>Target</span>
      </div>
    </section>
  );
}
