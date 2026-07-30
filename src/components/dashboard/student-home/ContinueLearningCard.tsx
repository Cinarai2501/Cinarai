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
    <section className="relative overflow-hidden rounded-[28px] bg-white p-[12px] shadow-[0_14px_32px_rgba(15,23,42,0.10)]" style={{ minHeight: 138 }}>
      <div className="flex h-full items-start gap-[10px]">
        <div className="mt-[2px] h-[100px] w-[76px] shrink-0 overflow-hidden rounded-[20px] bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <Image src={coverAsset} alt={title} width={76} height={100} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 pt-[1px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">Continue Learning</p>
          <h2 className="mt-[3px] text-[17px] font-black leading-[22px] text-[#111827] line-clamp-2">{title}</h2>
          <div className="mt-[6px] flex flex-wrap items-center gap-[8px]">
            <span className="rounded-full bg-[#EAF4FF] px-2 py-1 text-[10px] font-semibold text-[#1D4ED8]">{progressPct}% selesai</span>
            <span className="text-[9px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</span>
          </div>
          <div className="mt-[8px] h-[8px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/siswa/komik"
        className="absolute right-[12px] bottom-[12px] flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_14px_28px_rgba(29,147,255,0.22)]"
        aria-label="Lanjutkan belajar"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
