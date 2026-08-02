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
    <section className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] min-h-[160px] flex items-center">
      <div className="flex w-full items-center gap-3 pr-12">
        <div className="h-[100px] w-[90px] shrink-0 overflow-hidden rounded-2xl bg-[#F6F9FE] shadow-sm">
          <Image src={coverAsset} alt={title} width={90} height={100} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1D93FF]">
            <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
            </svg>
            <span>LANJUTKAN BELAJAR</span>
          </div>
          <h2 className="mt-1 text-[16px] font-bold leading-tight text-[#111827] line-clamp-2">{title}</h2>
          
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[15px] font-bold text-[#1D93FF]">{progressPct}%</span>
            <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#EEF4FB]">
              <div className="h-full rounded-full bg-[#1D93FF] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</p>
        </div>
      </div>

      <Link
        href="/dashboard/siswa/komik"
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#1D93FF] text-white shadow-[0_8px_20px_rgba(29,147,255,0.30)] transition-transform active:scale-95"
        aria-label="Lanjutkan belajar"
      >
        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </section>
  );
}
