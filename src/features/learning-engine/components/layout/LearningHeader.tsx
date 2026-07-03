'use client';

import Link from 'next/link';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningHeader() {
  const { comic } = useLearningEngine();

  return (
    <header className="flex items-center gap-3 bg-white border-b border-neutral-200 px-4 py-3 sm:px-6">
      <Link
        href="/dashboard"
        aria-label="Kembali ke dashboard"
        className="flex items-center justify-center min-h-touch min-w-touch -ml-1 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary-600 truncate">
          Kelas {comic.kelas} · {comic.lokasi}
        </p>
        <h1 className="text-sm font-bold text-neutral-900 truncate sm:text-base">
          {comic.title}
        </h1>
      </div>
    </header>
  );
}
