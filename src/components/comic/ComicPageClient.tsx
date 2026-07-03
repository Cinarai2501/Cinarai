'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchComicById } from '@/services/comicFirestoreService';
import { useComicProgress } from '@/hooks/useComicProgress';
import type { Comic } from '@/types/comic';

const PdfReader = dynamic(() => import('./PdfReader'), { ssr: false });

interface ComicPageClientProps {
  comicId: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ComicPageClient({ comicId }: ComicPageClientProps) {
  const router = useRouter();
  const { state, complete } = useComicProgress(comicId);
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchComicById(comicId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setFetchError(`Komik ${comicId} tidak ditemukan.`);
        else setComic(data);
      })
      .catch(() => {
        if (!cancelled) setFetchError('Gagal memuat data komik.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [comicId]);

  const handlePageChange = useCallback((page: number, numPages: number) => {
    setCurrentPage(page);
    setTotalPages(numPages);
  }, []);

  const handleComplete = useCallback(async () => {
    if (savingRef.current || state.isCompleted) return;

    const contextualizationDone = state.sintaksList.some(
      (s) => s.sintaks === 'Contextualization' && s.status === 'COMPLETED'
    );
    if (contextualizationDone) {
      router.push(`/comic/${comicId}/learn`);
      return;
    }

    savingRef.current = true;
    setSaveStatus('saving');
    try {
      await complete('Contextualization');
      setSaveStatus('saved');
      router.push(`/comic/${comicId}/learn`);
    } catch {
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [state, complete, comicId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </main>
    );
  }

  if (fetchError || !comic) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-6 gap-4 text-center">
        <span className="text-5xl">📭</span>
        <p className="text-base font-black text-white">Komik Tidak Ditemukan</p>
        <p className="text-sm text-gray-400">{fetchError}</p>
        <Link href="/dashboard" className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white">
          ← Kembali ke Dashboard
        </Link>
      </main>
    );
  }

  if (comic.availability === 'COMING_SOON') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f0f7ff] px-6 gap-5 text-center">
        <span className="text-6xl">🛠️</span>
        <div>
          <h2 className="text-xl font-black text-neutral-800">Segera Hadir!</h2>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{comic.subtitle}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          ← Kembali ke Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-900">
      <div
        className="flex items-center gap-3 px-3 py-2 bg-gray-800 text-white flex-shrink-0"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Kembali ke dashboard"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="flex-1 text-sm font-semibold text-gray-100 truncate min-w-0">
          {comic.title}
        </span>
        {totalPages > 0 && (
          <span className="flex-shrink-0 text-xs font-bold tabular-nums text-gray-300 bg-gray-700 rounded-lg px-2.5 py-1.5 leading-none">
            {currentPage} / {totalPages}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {comic.pdfPath ? (
          <PdfReader
            pdfPath={comic.pdfPath}
            onComplete={handleComplete}
            onPageChange={handlePageChange}
            showCompleteButton
            completeButtonLabel={
              saveStatus === 'saving'
                ? 'Menyimpan...'
                : saveStatus === 'error'
                  ? 'Gagal — Coba Lagi'
                  : 'Selesaikan Komik'
            }
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white py-20">
            <p className="text-lg font-semibold">Coming Soon</p>
            <p className="text-sm text-gray-400">{comic.subtitle}</p>
          </div>
        )}
      </div>
    </main>
  );
}
