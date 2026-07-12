'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useSnackbar } from '@/context/SnackbarContext';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import { Hero3DViewer } from './Hero3DViewer';
import { AssemblrCard } from './AssemblrCard';

/* eslint-disable @next/next/no-img-element */

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/* eslint-disable @next/next/no-img-element */

export default function NavigationStage() {
  const router = useRouter();
  const { comic, comicModule, setCanAdvance, unregisterSlideNav, nextStage } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const navigationObjects = useMemo<ComicAssetEntry[]>(
    () =>
      comicModule.navigation.learningObjects.map((object: {
        page: number;
        title: string;
        description: string;
        provider?: string;
        embedUrl?: string;
        modelUrl?: string;
        qrImage?: string;
        aiPrompt?: string;
      }) => ({
        page: object.page,
        title: object.title,
        description: object.description,
        buttonLabel: 'Lihat Model 3D',
        provider: object.provider,
        viewerType: object.embedUrl ? 'embed' : 'assemblr',
        embedUrl: object.embedUrl,
        arUrl: object.modelUrl ?? object.embedUrl ?? '',
        qrImage: object.qrImage,
        aiPrompt: object.aiPrompt,
        knowledgeText: object.description,
      })),
    [comicModule.navigation.learningObjects],
  );
  const primaryEntry = navigationObjects[0] ?? null;
  const [activeObjectId, setActiveObjectId] = useState<string | null>(null);
  const activeEntry = useMemo(() => {
    if (!navigationObjects.length) return null;
    if (activeObjectId) {
      const matched = navigationObjects.find((entry) => `${entry.page}-${entry.arUrl}` === activeObjectId);
      if (matched) return matched;
    }
    return primaryEntry;
  }, [activeObjectId, navigationObjects, primaryEntry]);

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  useEffect(() => {
    if (!primaryEntry) {
      setActiveObjectId(null);
      return;
    }

    const storedId = typeof window !== 'undefined' ? window.sessionStorage.getItem('navigationStageLastOpenedObjectId') : null;
    const nextActiveId = storedId ? storedId : `${primaryEntry.page}-${primaryEntry.arUrl}`;
    setActiveObjectId((current) => (current ? current : nextActiveId));
  }, [primaryEntry]);

  useEffect(() => {
    if (!activeObjectId || typeof window === 'undefined') return;

    const target = document.querySelector(`[data-object-id="${activeObjectId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeObjectId]);

  useEffect(() => {
    if (!activeObjectId || typeof window === 'undefined') return;

    const target = document.querySelector(`[data-object-id="${activeObjectId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeObjectId]);

  useEffect(() => {
    return () => {
      unregisterSlideNav();
    };
  }, [unregisterSlideNav]);

  function handleOpenAr(entry: ComicAssetEntry, openQr = false) {
    const entryUrl = entry.viewerType === 'embed' ? entry.embedUrl || entry.arUrl : entry.arUrl;
    if (!isValidUrl(entryUrl)) {
      showSnackbar('Link AR belum tersedia.', 'info');
      return;
    }

    const entryId = `${entry.page}-${entry.arUrl}`;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('navigationStageLastOpenedObjectId', entryId);
    }
    setActiveObjectId(entryId);

    const url = `/viewer/3d?url=${encodeURIComponent(entryUrl)}&title=${encodeURIComponent(entry.title)}&comicId=${comic.id}&page=${entry.page}`;
    router.push(openQr ? `${url}&mode=qr` : url);
  }

  function handleContinueToArgumentation() {
    void nextStage();
  }

  const featuredEntry = primaryEntry?.viewerType === 'embed' ? primaryEntry : null;

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden px-2 py-2 sm:px-4 sm:py-4">
      {featuredEntry && (
        <Hero3DViewer entry={featuredEntry} />
      )}

      <div className="space-y-5">
        <div className="space-y-3 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary-600">Daftar Objek</p>
          <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl">Pilih objek untuk dipelajari</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            Sentuh kartu untuk melihat detail dan buka Model 3D atau QR. Semakin banyak objek kamu eksplorasi, semakin cepat bisa lanjut.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navigationObjects.length > 0 ? (
            navigationObjects.map((entry, idx) => {
              const entryId = `${entry.page}-${entry.arUrl}`;
              const isActive = activeEntry ? `${activeEntry.page}-${activeEntry.arUrl}` === entryId : idx === 0;
              const isValid = isValidUrl(entry.arUrl);

              return (
                <AssemblrCard
                  key={entryId}
                  entry={entry}
                  isActive={isActive}
                  onSelect={() => setActiveObjectId(entryId)}
                  onOpenAr={(e) => {
                    e.stopPropagation();
                    setActiveObjectId(entryId);
                    handleOpenAr(entry);
                  }}
                  onOpenQr={(e) => {
                    e.stopPropagation();
                    setActiveObjectId(entryId);
                    handleOpenAr(entry, true);
                  }}
                  isValidUrl={isValid}
                />
              );
            })
          ) : (
            <div className="col-span-full rounded-[20px] bg-neutral-50 p-5 text-center text-sm text-neutral-500 shadow-sm">
              Tidak ada objek AR untuk komik ini.
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mx-auto w-full max-w-2xl rounded-t-[20px] bg-white/90 px-4 py-5 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6">
        <button
          type="button"
          onClick={handleContinueToArgumentation}
          className="w-full rounded-[20px] bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 text-base font-black text-white shadow-lg transition hover:shadow-xl active:scale-95 min-h-[48px]"
        >
          Lanjut ke Argumentasi
        </button>
      </div>

    </div>
  );
}
