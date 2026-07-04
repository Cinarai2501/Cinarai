'use client';

import Link from 'next/link';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningHeader() {
  const { comic } = useLearningEngine();

  return (
    <header
      className="flex items-center gap-3 bg-white border-b border-neutral-100 px-3 py-2.5 sm:px-6 sm:py-3 shadow-sm"
      style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
    >
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
        <p className="text-[11px] font-semibold text-neutral-400 truncate">
          Kelas {comic.kelas} · {comic.lokasi}
        </p>
        <h1 className="text-sm font-black text-neutral-800 truncate sm:text-base leading-tight">
          {comic.title}
        </h1>
      </div>
    </header>
  );
}
