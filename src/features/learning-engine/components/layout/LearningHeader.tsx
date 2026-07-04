'use client';

import Link from 'next/link';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningHeader() {
  const { comic } = useLearningEngine();

  return (
    <header
      className="bg-white border-b border-neutral-100 shadow-sm"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      <div className="mx-auto w-full max-w-[1400px] flex items-center gap-3 px-3 py-2.5 md:px-6 md:py-3 lg:px-8">
        <Link
          href="/dashboard"
          aria-label="Kembali ke dashboard"
          className="flex items-center justify-center h-9 w-9 flex-shrink-0 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] md:text-xs font-semibold text-neutral-400 truncate">
            Kelas {comic.kelas} · {comic.lokasi}
          </p>
          <h1 className="text-sm md:text-base lg:text-lg font-black text-neutral-800 truncate leading-tight">
            {comic.title}
          </h1>
        </div>

        {/* Desktop: show subtitle */}
        <p className="hidden lg:block text-sm text-neutral-400 truncate max-w-xs xl:max-w-sm">
          {comic.subtitle}
        </p>
      </div>
    </header>
  );
}
