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
    <section className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] min-h-[180px]" style={{ minHeight: 180 }}>
      <div className="flex h-full items-center gap-3">
        <div className="h-[100px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#F6F9FE] shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
          <Image src={coverAsset} alt={title} width={88} height={100} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 pt-[1px]">
          <p className="text-[16px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Continue Learning</p>
          <h2 className="mt-1 text-[20px] font-semibold leading-[26px] text-[#111827] line-clamp-2">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EAF4FF] px-2.5 py-1 text-[14px] font-semibold text-[#1D4ED8]">{progressPct}% selesai</span>
            <span className="text-[14px] font-medium text-[#6B7280]">4 dari 8 tahap selesai</span>
          </div>
          <div className="mt-2 h-[8px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/siswa/komik"
        className="absolute right-4 bottom-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_14px_28px_rgba(29,147,255,0.22)]"
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
