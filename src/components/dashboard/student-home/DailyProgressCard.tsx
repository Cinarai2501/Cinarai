'use client';

import Link from 'next/link';

type DailyProgressCardProps = {
  progressPct: number;
  nextStageLabel: string;
};

export default function DailyProgressCard({ progressPct, nextStageLabel }: DailyProgressCardProps) {
  return (
    <section className="h-[110px] rounded-[24px] bg-[#FEFCFF] p-[12px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="flex h-full flex-col justify-between gap-[10px]">
        <div className="flex items-center justify-between gap-[8px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#E0F2FE] text-[#1D93FF]">
              <svg viewBox="0 0 24 24" className="h-[12px] w-[12px]" fill="none" stroke="#1D93FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h16" />
                <path d="M12 4v16" />
              </svg>
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
          </div>
          <Link href="/dashboard/siswa/komik" className="rounded-full bg-[#1D93FF] px-[10px] py-[7px] text-[10px] font-semibold text-white">Lihat</Link>
        </div>
        <div className="flex items-end justify-between gap-[8px]">
          <div>
            <p className="text-[10px] font-medium text-[#475569]">Kamu sudah menyelesaikan</p>
            <p className="mt-[4px] text-[20px] font-black text-[#111827]">{progressPct}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Tahap berikutnya</p>
            <p className="mt-[4px] text-[11px] font-semibold text-[#111827]">{nextStageLabel}</p>
          </div>
        </div>
        <div className="h-[8px] overflow-hidden rounded-full bg-[#E0F2FE]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${Math.max(8, progressPct)}%` }} />
        </div>
      </div>
    </section>
  );
}
