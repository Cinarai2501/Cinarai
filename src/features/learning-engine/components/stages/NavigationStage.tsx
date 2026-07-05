'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import { useSnackbar } from '@/context/SnackbarContext';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildViewerPath(entry: ComicAssetEntry, comicId: number): string {
  const params = new URLSearchParams();
  params.set('url', entry.url);
  params.set('title', entry.title);
  params.set('comicId', String(comicId));
  params.set('page', String(entry.page));
  return `/viewer/3d?${params.toString()}`;
}

// ── Asset row ──────────────────────────────────────────────────────────────────

function AssetRow({ entry, onOpen }: { entry: ComicAssetEntry; onOpen?: (entry: ComicAssetEntry) => void }) {
  const hasValidUrl = isValidUrl(entry.url);
  const canOpen = Boolean(onOpen) && hasValidUrl;
  const title = entry.title?.trim() || 'Model 3D';

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <div className="min-w-0">
        <p className="text-base font-black text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500">Halaman {entry.page}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (canOpen) onOpen?.(entry);
        }}
        disabled={!canOpen}
        className={`flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-2xl border px-4 text-base font-semibold touch-manipulation transition ${
          canOpen
            ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'border-primary-200 bg-primary-50 text-primary-700 disabled:opacity-60'
        }`}
      >
        {entry.buttonLabel}
      </button>
      {!canOpen && (
        <span className="inline-flex w-fit rounded-full bg-warning-100 px-3 py-1 text-base font-bold text-warning-700">
          Segera Hadir
        </span>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

type SlideKey = 'model3d' | 'video' | 'quiz' | 'website' | 'qr' | 'ai';

interface Slide {
  key: SlideKey;
  icon: string;
  label: string;
  entries?: ComicAssetEntry[];
}

export default function NavigationStage() {
  const router = useRouter();
  const { comic, setCanAdvance, registerSlideNav, unregisterSlideNav } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const metadata = useComicMetadata(comic.id);
  const { model3D, video, quiz, website } = metadata.assets;

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  const slides = useMemo<Slide[]>(() => [
    ...(model3D.length > 0 ? [{ key: 'model3d' as SlideKey, icon: '🧊', label: 'Model 3D', entries: model3D }] : []),
    ...(video.length > 0   ? [{ key: 'video'   as SlideKey, icon: '🎬', label: 'Video',    entries: video   }] : []),
    ...(quiz.length > 0    ? [{ key: 'quiz'    as SlideKey, icon: '📝', label: 'Kuis',     entries: quiz    }] : []),
    ...(website.length > 0 ? [{ key: 'website' as SlideKey, icon: '🌐', label: 'Website',  entries: website }] : []),
    { key: 'qr', icon: '📱', label: 'QR Model' },
    { key: 'ai', icon: '🤖', label: 'AI Assistant' },
  ], [model3D, video, quiz, website]);

  const totalSlides = slides.length;
  const safeIndex = Math.min(slideIndex, totalSlides - 1);

  const goNext = useCallback(() => setSlideIndex((i) => Math.min(i + 1, totalSlides - 1)), [totalSlides]);
  const goPrev = useCallback(() => setSlideIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    registerSlideNav({
      slideIndex: safeIndex,
      totalSlides,
      canGoNext: safeIndex < totalSlides - 1,
      canGoPrev: safeIndex > 0,
      goNext,
      goPrev,
    });
  }, [safeIndex, totalSlides, goNext, goPrev, registerSlideNav]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  function handleOpenModel3D(entry: ComicAssetEntry) {
    if (!isValidUrl(entry.url)) {
      showSnackbar('Model 3D belum tersedia.', 'info');
      return;
    }
    router.push(buildViewerPath(entry, comic.id));
  }

  const slide = slides[safeIndex];
  if (!slide) return null;

  return (
    <div className="flex min-w-0 flex-col gap-3 overflow-x-hidden px-1 py-1 animate-fade-in-up sm:gap-4 sm:px-2">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
            🧭
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-neutral-900">Navigasi Interaktif</h2>
            <p className="truncate text-base text-neutral-500">{comic.lokasi}</p>
          </div>
        </div>
      </div>

      {/* Slide progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSlideIndex(i)}
            aria-label={s.label}
            className={[
              'h-2 rounded-full transition-all',
              i === safeIndex ? 'w-6 bg-primary-600' : 'w-2 bg-neutral-300',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Slide header */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-2xl">{slide.icon}</span>
        <h3 className="text-lg font-black text-neutral-900">{slide.label}</h3>
        <span className="ml-auto text-sm font-bold text-neutral-400">{safeIndex + 1} / {totalSlides}</span>
      </div>

      {/* Slide content */}
      {slide.key === 'model3d' && slide.entries && (
        <div className="flex flex-col gap-3">
          {slide.entries.map((entry) => (
            <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} onOpen={handleOpenModel3D} />
          ))}
        </div>
      )}

      {slide.key === 'video' && slide.entries && (
        <div className="flex flex-col gap-3">
          {slide.entries.map((entry) => (
            <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
          ))}
        </div>
      )}

      {slide.key === 'quiz' && slide.entries && (
        <div className="flex flex-col gap-3">
          {slide.entries.map((entry) => (
            <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
          ))}
        </div>
      )}

      {slide.key === 'website' && slide.entries && (
        <div className="flex flex-col gap-3">
          {slide.entries.map((entry) => (
            <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
          ))}
        </div>
      )}

      {slide.key === 'qr' && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 shadow-sm">
          <p className="mb-4 text-base leading-relaxed text-neutral-600">
            Gunakan QR untuk membuka model 3D pada perangkat lain.
          </p>
          <button
            type="button"
            disabled
            className="flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 px-4 text-base font-semibold text-primary-700 touch-manipulation disabled:cursor-not-allowed disabled:opacity-60"
          >
            📥 Tampilkan QR
          </button>
          <span className="mt-3 inline-flex w-fit rounded-full bg-warning-100 px-3 py-1 text-base font-bold text-warning-700">
            Segera Hadir
          </span>
        </div>
      )}

      {slide.key === 'ai' && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 shadow-sm">
          <p className="mb-4 text-base leading-relaxed text-neutral-600">
            Tanyakan apa saja mengenai materi komik ini.
          </p>
          <textarea
            disabled
            placeholder="Tulis pertanyaanmu..."
            className="min-h-[88px] w-full min-w-0 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-500 outline-none"
          />
          <button
            type="button"
            disabled
            className="mt-3 flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 px-4 text-base font-semibold text-primary-700 touch-manipulation disabled:cursor-not-allowed disabled:opacity-60"
          >
            Kirim
          </button>
          <span className="mt-3 inline-flex w-fit rounded-full bg-warning-100 px-3 py-1 text-base font-bold text-warning-700">
            Segera Hadir
          </span>
        </div>
      )}

    </div>
  );
}
