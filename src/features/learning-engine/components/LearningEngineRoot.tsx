'use client';

import { useEffect, useState } from 'react';
import { fetchComicById } from '@/services/comicFirestoreService';
import LearningEngine from './LearningEngine';
import { LearningPageSkeleton } from './LearningEngine';
import type { Comic } from '@/types/comic';

interface LearningEngineRootProps {
  comicId: number;
}

export default function LearningEngineRoot({ comicId }: LearningEngineRootProps) {
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      if (!cancelled) setError('Koneksi terlalu lama. Periksa internet kamu dan muat ulang halaman.');
    }, 15_000);

    fetchComicById(comicId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(`Komik dengan ID ${comicId} tidak ditemukan.`);
        } else {
          setComic(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat data komik. Periksa koneksi internet kamu.');
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [comicId]);

  if (loading) {
    return <LearningPageSkeleton />;
  }

  if (error || !comic) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-6 gap-4 text-center">
        <span className="text-5xl">📭</span>
        <div>
          <p className="text-base font-black text-neutral-800">Komik Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            {error ?? 'Data komik tidak tersedia.'}
          </p>
        </div>
      </div>
    );
  }

  return <LearningEngine comic={comic} />;
}
