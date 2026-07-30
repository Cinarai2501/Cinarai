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
    <section className="overflow-hidden rounded-[32px] bg-white p-[18px] shadow-[0_16px_40px_rgba(15,23,42,0.12)]" style={{ minHeight: 210 }}>
      <div className="flex h-full items-start gap-[16px]">
        <div className="mt-[2px] h-[132px] w-[104px] shrink-0 overflow-hidden rounded-[24px] bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <Image src={coverAsset} alt={title} width={104} height={132} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 pt-[2px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">Continue Learning</p>
          <h2 className="mt-[6px] text-[21px] font-black leading-[28px] text-[#111827] line-clamp-2">{title}</h2>
          <div className="mt-[12px] flex items-center gap-[10px]">
            <span className="rounded-full bg-[#EAF4FF] px-3 py-1 text-[12px] font-semibold text-[#1D4ED8]">{progressPct}% selesai</span>
            <span className="text-[12px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</span>
          </div>
          <div className="mt-[14px] h-[12px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/siswa/komik"
        className="absolute right-[16px] bottom-[16px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_16px_32px_rgba(29,147,255,0.22)]"
        aria-label="Lanjutkan belajar"
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
