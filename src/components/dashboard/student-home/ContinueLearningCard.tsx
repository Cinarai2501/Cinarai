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
    <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]" style={{ minHeight: 180 }}>
      <div className="flex h-full items-start gap-[12px]">
        <div className="mt-[2px] h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[22px] bg-slate-100">
          <Image src={coverAsset} alt={title} width={92} height={112} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 pt-[2px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Continue Learning</p>
          <h2 className="mt-[4px] max-w-[180px] text-[18px] font-black leading-[23px] text-[#111827] line-clamp-2">{title}</h2>
          <div className="mt-[10px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-[10px] flex items-center justify-between gap-[8px]">
            <div className="flex flex-col">
              <p className="text-[12px] font-semibold text-[#1D93FF]">{progressPct}%</p>
              <p className="text-[11px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</p>
            </div>
            <Link href="/dashboard/siswa/komik" className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_8px_16px_rgba(29,147,255,0.24)]" aria-label="Lanjutkan belajar">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
