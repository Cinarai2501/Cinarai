'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  stageLabel: string;
};

export default function DailyProgressCard({ progressPct, stageLabel }: DailyProgressCardProps) {
  return (
    <section className="rounded-[28px] bg-[#FEFCFF] p-[18px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]" style={{ minHeight: 168 }}>
      <div className="flex items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E0F2FE] text-[#1D93FF]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#1D93FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16" />
              <path d="M12 4v16" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
          </div>
        </div>
        <Link href="/dashboard/siswa/komik" className="rounded-full bg-[#1D93FF] px-[12px] py-[10px] text-[12px] font-semibold text-white">Lihat</Link>
      </div>
      <div className="mt-[10px] flex items-end justify-between gap-[12px]">
        <div>
          <p className="text-[14px] font-medium text-[#475569]">Kamu sudah menyelesaikan</p>
          <p className="mt-[4px] text-[28px] font-black text-[#111827]">{progressPct}%</p>
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{stageLabel}</p>
      </div>
      <div className="mt-[14px] h-[12px] overflow-hidden rounded-full bg-[#E0F2FE]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${Math.max(8, progressPct)}%` }} />
      </div>
    </section>
  );
}
