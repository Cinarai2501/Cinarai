'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchComicById } from '@/services/comicFirestoreService';
import { useComicProgress } from '@/hooks/useComicProgress';
import type { Comic } from '@/types/comic';

const PdfReader = dynamic(() => import('./PdfReader'), { ssr: false });

const FETCH_TIMEOUT_MS = 12_000;

interface ComicPageClientProps {
  comicId: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ComicPageClient({ comicId }: ComicPageClientProps) {
  const router = useRouter();
  const { complete } = useComicProgress(comicId);
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const savingRef = useRef(false);
  const navigatedRef = useRef(false);

  const loadComic = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        console.error(`[ComicPageClient] fetchComicById timeout — comicId: ${comicId}`);
        setFetchError('timeout');
        setLoading(false);
      }
    }, FETCH_TIMEOUT_MS);

    fetchComicById(comicId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          console.error(`[ComicPageClient] fetchComicById: komik ${comicId} tidak ditemukan`);
          setFetchError('not_found');
        } else {
          setComic(data);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(`[ComicPageClient] fetchComicById gagal — comicId: ${comicId}`, error);
        setFetchError('network');
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

  useEffect(() => {
    return loadComic();
  }, [loadComic]);

  // Auto-navigate to learn page 1 second after save succeeds
  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const t = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.push(`/comic/${comicId}/learn`);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [saveStatus, comicId, router]);

  const handlePageChange = useCallback((page: number, numPages: number) => {
    setCurrentPage(page);
    setTotalPages(numPages);
  }, []);

  const handleComplete = useCallback(async () => {
    if (savingRef.current || navigatedRef.current) return;

    savingRef.current = true;
    setSaveStatus('saving');
    try {
      await complete('Contextualization');
      setSaveStatus('saved');
    } catch (error) {
      console.error(`[ComicPageClient] handleComplete gagal — comicId: ${comicId}`, error);
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [complete, comicId]);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f0f7ff] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-3xl shadow">
          📖
        </div>
        <div className="h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-primary-600">Memuat komik...</p>
      </main>
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (fetchError || !comic) {
    const errorMsg =
      fetchError === 'timeout'
        ? 'Koneksi internet kamu lambat. Coba lagi ya!'
        : fetchError === 'not_found'
          ? 'Komik ini belum tersedia.'
          : 'Tidak bisa memuat komik. Periksa internet kamu.';

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f0f7ff] px-6 gap-5 text-center">
        <span className="text-6xl">😕</span>
        <div>
          <p className="text-lg font-black text-neutral-800">Aduh, ada masalah!</p>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{errorMsg}</p>
        </div>
        <button
          onClick={loadComic}
          className="rounded-2xl bg-primary-600 px-8 py-3.5 text-base font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          Coba Lagi
        </button>
        <Link href="/dashboard" className="text-sm text-neutral-400 underline underline-offset-2">
          ← Kembali ke Beranda
        </Link>
      </main>
    );
  }

  // ── Coming soon screen ─────────────────────────────────────────────────────
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
          className="rounded-2xl bg-primary-600 px-8 py-3.5 text-base font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          ← Kembali ke Beranda
        </Link>
      </main>
    );
  }

  // ── Success overlay ────────────────────────────────────────────────────────
  const showSuccessOverlay = saveStatus === 'saved';

  return (
    <main className="flex flex-col min-h-screen bg-[#f0f7ff]">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-2 bg-white border-b border-neutral-100 flex-shrink-0 shadow-sm"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex-shrink-0"
          aria-label="Kembali ke beranda"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-neutral-400 leading-none">Sedang membaca</p>
          <p className="text-sm font-black text-neutral-800 truncate leading-snug mt-0.5">
            {comic.title}
          </p>
        </div>
        {totalPages > 0 && (
          <span className="flex-shrink-0 text-xs font-black text-primary-600 bg-primary-50 rounded-lg px-2.5 py-1.5 leading-none">
            {currentPage}/{totalPages}
          </span>
        )}
      </div>

      {/* PDF Reader */}
      <div className="flex-1 min-h-0 relative">
        {comic.pdfPath ? (
          <PdfReader
            pdfPath={comic.pdfPath}
            onComplete={handleComplete}
            onPageChange={handlePageChange}
            showCompleteButton
            completeButtonDisabled={saveStatus === 'saving'}
            completeButtonLabel="🎉 Selesai Membaca"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <span className="text-5xl">🛠️</span>
            <p className="text-base font-black text-neutral-700">Komik segera hadir!</p>
            <p className="text-sm text-neutral-500">{comic.subtitle}</p>
          </div>
        )}

        {/* ── Success overlay ──────────────────────────────────────────────── */}
        {showSuccessOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-20 gap-5 px-8 text-center animate-fade-in">
            {/* Animated checkmark */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 shadow-lg">
              <svg
                className="w-14 h-14 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{ animation: 'checkmark-draw 0.4s ease-out forwards' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-black text-neutral-800">Hebat! 🌟</p>
              <p className="mt-2 text-base text-neutral-600 leading-relaxed">
                Kamu sudah selesai membaca.<br />
                Sekarang kita lanjut ke aktivitas berikutnya!
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400 font-semibold">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
              Menyiapkan aktivitas...
            </div>
          </div>
        )}

        {/* ── Error retry banner ───────────────────────────────────────────── */}
        {saveStatus === 'error' && (
          <div className="absolute bottom-0 left-0 right-0 bg-orange-50 border-t-2 border-orange-200 px-4 py-3 flex items-center gap-3 z-10">
            <span className="text-2xl flex-shrink-0">😅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-orange-800">Belum tersimpan</p>
              <p className="text-xs text-orange-600">Periksa internet kamu, lalu tekan tombol lagi.</p>
            </div>
            <button
              onClick={() => setSaveStatus('idle')}
              className="flex-shrink-0 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white hover:bg-orange-600 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Inline keyframe for checkmark draw animation */}
      <style>{`
        @keyframes checkmark-draw {
          from { stroke-dasharray: 0 100; opacity: 0; }
          to   { stroke-dasharray: 100 0; opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
