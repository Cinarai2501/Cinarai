'use client';

import { useEffect, useState } from 'react';
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

// ── Accordion ──────────────────────────────────────────────────────────────────

interface AccordionItemProps {
  icon: string;
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionItem({ icon, label, count, defaultOpen = false, children }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Touch target min 48px — py-3 + text-base = ~48px */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[52px] w-full min-w-0 items-center gap-3 px-4 py-3 text-left touch-manipulation active:bg-neutral-50"
        aria-expanded={open}
      >
        <span className="text-2xl leading-none">{icon}</span>
        <span className="flex-1 text-base font-black text-neutral-900">{label}</span>
        {count !== undefined && (
          <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700">
            {count}
          </span>
        )}
        <svg
          className={`h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </div>
  );
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

export default function NavigationStage() {
  const router = useRouter();
  const { comic, setCanAdvance } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const metadata = useComicMetadata(comic.id);
  const { model3D, video, quiz, website } = metadata.assets;
  const isEmpty = model3D.length === 0 && video.length === 0 && quiz.length === 0 && website.length === 0;

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  function handleOpenModel3D(entry: ComicAssetEntry) {
    if (!isValidUrl(entry.url)) {
      showSnackbar('Model 3D belum tersedia.', 'info');
      return;
    }

    router.push(buildViewerPath(entry, comic.id));
  }

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
            {/* truncate mencegah overflow panjang nama lokasi */}
            <p className="truncate text-base text-neutral-500">{comic.lokasi}</p>
          </div>
        </div>
      </div>

      {/* Accordion — Model 3D */}
      {model3D.length > 0 && (
        <AccordionItem icon="🧊" label="Model 3D" count={model3D.length} defaultOpen>
          <div className="flex flex-col gap-3">
            {model3D.map((entry) => (
              <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} onOpen={handleOpenModel3D} />
            ))}
          </div>
        </AccordionItem>
      )}

      {/* Accordion — Video */}
      {video.length > 0 && (
        <AccordionItem icon="🎬" label="Video" count={video.length}>
          <div className="flex flex-col gap-3">
            {video.map((entry) => (
              <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
            ))}
          </div>
        </AccordionItem>
      )}

      {/* Accordion — Kuis */}
      {quiz.length > 0 && (
        <AccordionItem icon="📝" label="Kuis" count={quiz.length}>
          <div className="flex flex-col gap-3">
            {quiz.map((entry) => (
              <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
            ))}
          </div>
        </AccordionItem>
      )}

      {/* Accordion — Website */}
      {website.length > 0 && (
        <AccordionItem icon="🌐" label="Website" count={website.length}>
          <div className="flex flex-col gap-3">
            {website.map((entry) => (
              <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} />
            ))}
          </div>
        </AccordionItem>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-center text-base text-neutral-500 shadow-sm">
          Belum ada aset interaktif untuk komik ini.
        </div>
      )}

      {/* Accordion — QR Model */}
      <AccordionItem icon="📱" label="QR Model">
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
      </AccordionItem>

      {/* Accordion — AI Assistant */}
      <AccordionItem icon="🤖" label="AI Assistant">
        <p className="mb-4 text-base leading-relaxed text-neutral-600">
          Tanyakan apa saja mengenai materi komik ini.
        </p>
        {/* font-size 16px mencegah auto-zoom pada iOS/Android */}
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
      </AccordionItem>

    </div>
  );
}
