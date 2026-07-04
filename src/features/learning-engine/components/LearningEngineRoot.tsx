'use client';

import { useEffect } from 'react';
import LearningEngine from './LearningEngine';
import { getComicById } from '../services/comicService';

interface LearningEngineRootProps {
  comicId: number;
}

export default function LearningEngineRoot({ comicId }: LearningEngineRootProps) {
  // Reset window scroll immediately on mount — prevents inheriting the PDF
  // reader's scroll position when navigating from /comic/[id] to /comic/[id]/learn.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const comic = getComicById(comicId);

  if (!comic) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-6 gap-4 text-center">
        <span className="text-5xl">📭</span>
        <div>
          <p className="text-base font-black text-neutral-800">Komik Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            Komik dengan ID {comicId} tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return <LearningEngine comic={comic} />;
}
