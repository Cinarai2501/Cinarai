'use client';

import Link from 'next/link';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningHeader() {
  const { comic } = useLearningEngine();

  return (
    <header className="flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 sm:px-6"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <Link
        href="/dashboard"
        aria-label="Kembali ke dashboard"
        className="flex items-center justify-center h-9 w-9 flex-shrink-0 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-primary-200 truncate">
          Kelas {comic.kelas} · {comic.lokasi}
        </p>
        <h1 className="text-sm font-black text-white truncate sm:text-base leading-tight">
          {comic.title}
        </h1>
      </div>
    </header>
  );
}
