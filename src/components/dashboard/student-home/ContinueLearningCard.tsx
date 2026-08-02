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
    <section className="relative overflow-hidden rounded-[26px] bg-white p-[14px] shadow-[0_12px_24px_rgba(15,23,42,0.10)]" style={{ maxHeight: 110, minHeight: 110 }}>
      <div className="flex h-full items-center gap-[12px]">
        <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[20px] bg-slate-100 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <Image src={coverAsset} alt={title} width={88} height={88} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">Continue Learning</p>
          <h2 className="mt-[4px] text-[15px] font-black leading-[1.12] text-[#111827] line-clamp-2">{title}</h2>
          <div className="mt-[7px] flex flex-wrap items-center gap-[6px]">
            <span className="rounded-full bg-[#EAF4FF] px-2 py-[4px] text-[10px] font-semibold text-[#1D4ED8]">{progressPct}% selesai</span>
            <span className="text-[9px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</span>
          </div>
          <div className="mt-[8px] h-[7px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-[8px] text-[12px] font-medium text-[#6B7280]">Lanjutkan tahap berikutnya dan capai targetmu</p>
        </div>
      </div>

      <Link href="/dashboard/siswa/komik" className="absolute right-[12px] bottom-[12px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_12px_22px_rgba(29,147,255,0.22)]" aria-label="Lanjutkan belajar">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
