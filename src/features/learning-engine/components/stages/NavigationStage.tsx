'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import { useSnackbar } from '@/context/SnackbarContext';
// `useAuth` intentionally not used here (kept authentication & data flows intact elsewhere)
import { generateTutorResponse } from '@/lib/ai';
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

function getObjectDisplayName(entry: ComicAssetEntry | null | undefined): string {
  const rawName = entry?.title?.trim();
  if (rawName) return rawName;
  return 'Kubus';
}

// removed observation form options — Navigation is now exploration-only

function getQuickQuestions(objectName: string): string[] {
  const normalized = objectName.toLowerCase();
  if (normalized.includes('kubus')) {
    return [
      'Apa nama bangun ruang ini?',
      'Berapa jumlah sisinya?',
      'Berapa jumlah rusuknya?',
      'Berapa titik sudutnya?',
      'Mengapa bagian bawah Candi Jawi berbentuk kubus?',
    ];
  }
  if (normalized.includes('balok')) {
    return [
      'Apa nama bangun ruang ini?',
      'Berapa jumlah sisi balok ini?',
      'Apa perbedaan balok dan kubus?',
      'Bagaimana bentuk rusuk pada balok?',
    ];
  }
  if (normalized.includes('kerucut')) {
    return [
      'Apa nama bangun ruang ini?',
      'Apa ciri khas alas kerucut?',
      'Apa perbedaan kerucut dan tabung?',
      'Mengapa bentuk atap candi mirip kerucut?',
    ];
  }
  if (normalized.includes('tabung')) {
    return [
      'Apa nama bangun ruang ini?',
      'Apa bentuk alas dan tutup tabung?',
      'Berapa jumlah rusuk tabung?',
      'Mengapa struktur ini sering muncul pada bangunan?',
    ];
  }
  return [
    'Apa nama bangun ruang ini?',
    'Berapa jumlah rusuknya?',
    'Bagaimana bentuk sisi-sisinya?',
    'Apa kaitannya dengan Candi Jawi?',
  ];
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: 'Halo! Aku siap membantu kamu mengamati objek ini dan mengaitkannya dengan bangun ruang di Candi Jawi.',
  },
];

/* eslint-disable @next/next/no-img-element */

export default function NavigationStage() {
  const { comic, setCanAdvance, unregisterSlideNav, nextStage } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const metadata = useComicMetadata(comic.id);
  const { model3D } = metadata.assets;
  const primaryEntry = model3D[0] ?? null;
  const activeObjectName = useMemo(() => getObjectDisplayName(primaryEntry), [primaryEntry]);
  const quickQuestions = useMemo(() => getQuickQuestions(activeObjectName), [activeObjectName]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [hasOpenedAr, setHasOpenedAr] = useState(false);
  const [hasAskedAi, setHasAskedAi] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const canAdvanceToArgumentation = hasOpenedAr && hasAskedAi;

  useEffect(() => {
    const candidates = [
      `/images/navigation/komik-${comic.id}-ar.png`,
      `/images/navigation/komik-${comic.id}-ar.jpg`,
      `/images/navigation/komik-${comic.id}-ar.webp`,
    ];

    let isMounted = true;
    let settled = false;

    const tryLoad = (src: string) => {
      if (settled) return;
      const image = new window.Image();
      image.onload = () => {
        if (!isMounted) return;
        settled = true;
        setPreviewSrc(src);
      };
      image.onerror = () => {
        if (!isMounted) return;
        if (src === candidates[candidates.length - 1]) {
          settled = true;
          setPreviewSrc(null);
        }
      };
      image.src = src;
    };

    candidates.forEach((candidate) => tryLoad(candidate));

    return () => {
      isMounted = false;
    };
  }, [comic.id]);

  useEffect(() => {
    setCanAdvance(canAdvanceToArgumentation);
    return () => {
      unregisterSlideNav();
    };
  }, [canAdvanceToArgumentation, setCanAdvance, unregisterSlideNav]);

  const handleToggleRotate = () => setIsRotating((v) => !v);
  const handleToggleZoom = () => setIsZoomed((v) => !v);
  const handleToggleEmbed = () => setShowEmbed((v) => !v);

  const handleSend = useCallback(async (rawText?: string) => {
    const trimmed = (rawText ?? draft).trim();
    if (!trimmed || isResponding || !comic) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setHasAskedAi(true);
    const historyForPrompt = nextMessages.map(({ role, content }) => ({ role, content }));

    setMessages(nextMessages);
    setDraft('');
    setIsResponding(true);

    try {
      const response = await generateTutorResponse({
        moduleName: comic.title,
        identification: [],
        objectInfo: {
          location: comic.lokasi,
          classLevel: comic.kelas,
          synopsis: comic.synopsis,
          learningTargets: comic.learningTargets,
        },
        observationAnswers: {},
        question: trimmed,
        sessionHistory: historyForPrompt,
        comicTitle: comic.title,
        pageLabel: primaryEntry ? `Halaman ${primaryEntry.page}` : undefined,
        objectName: activeObjectName,
        learningStage: 'Navigation',
      });

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[NavigationStage] Gagal memanggil AI', error);
      const fallbackMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsResponding(false);
    }
  }, [activeObjectName, comic, draft, isResponding, messages, primaryEntry]);

  function handleOpenAr(entry: ComicAssetEntry) {
    if (!isValidUrl(entry.url)) {
      showSnackbar('Link AR belum tersedia.', 'info');
      return;
    }
    setHasOpenedAr(true);
    // For Sketchfab embedded models, prefer opening embed in-page.
    const url = entry.url;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('sketchfab.com') || host.includes('skfb.ly')) {
        setShowEmbed(true);
        return;
      }
    } catch {
      // fallback to opening externally
    }
    window.open(entry.url, '_blank', 'noopener,noreferrer');
  }

  function handleContinueToArgumentation() {
    if (!canAdvanceToArgumentation) {
      showSnackbar('Silakan eksplorasi objek AR dan diskusikan hasil pengamatanmu dengan AI sebelum melanjutkan.', 'info');
      return;
    }
    void nextStage();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden px-1 py-1 animate-fade-in-up sm:gap-5 sm:px-2">
      <header className="rounded-[24px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
            🧭
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-600">Navigation (AR + AI)</p>
            <h2 className="mt-1 text-lg font-black text-neutral-900 sm:text-xl">Eksplorasi objek 3D dan tanyakan hasil pengamatanmu kepada AI.</h2>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-1">
        <section className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <div className="overflow-hidden rounded-[18px] border border-neutral-200 bg-white">
              {showEmbed && primaryEntry ? (
                <div className="h-64 w-full sm:h-80">
                  <iframe src={`${primaryEntry.url.replace(/\/$/, '')}/embed`} title={`Model 3D ${activeObjectName}`} className="h-full w-full border-0" allow="fullscreen" />
                </div>
              ) : previewSrc ? (
                <div className={`h-56 w-full overflow-hidden sm:h-72 ${isRotating ? 'animate-spin-slow' : ''}`}>
                  <img
                    src={previewSrc}
                    alt={`Tampilan ${activeObjectName} dalam AR`}
                    className={`h-full w-full object-cover transition-transform ${isZoomed ? 'scale-105' : 'scale-100'}`} 
                  />
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 text-center sm:h-72">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-700">
                    📷
                  </div>
                  <div>
                    <p className="text-base font-black text-neutral-900">Preview AR belum tersedia.</p>
                    <p className="mt-1 text-sm text-neutral-600">Screenshot asli untuk komik ini belum tersedia, tetapi pengalaman AR tetap bisa dibuka.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">Eksplorasi 3D</p>
              <h3 className="mt-1 text-xl font-black text-neutral-900">{activeObjectName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Eksplorasi model 3D, perbesar, putar, dan minta info dari AI.</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => primaryEntry && handleOpenAr(primaryEntry)}
                disabled={!primaryEntry || !isValidUrl(primaryEntry.url)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700"
              >
                Lihat AR Interaktif
              </button>
              <button
                type="button"
                onClick={handleToggleRotate}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
              >
                Putar
              </button>
              <button
                type="button"
                onClick={handleToggleZoom}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
              >
                Perbesar
              </button>
              <button
                type="button"
                onClick={() => showSnackbar(comic.synopsis || 'Tidak ada info lebih lanjut.', 'info')}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
              >
                Info
              </button>
              <button
                type="button"
                onClick={handleToggleEmbed}
                disabled={!primaryEntry}
                className="ml-auto inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                {showEmbed ? 'Tutup 3D' : 'View 3D'}
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleContinueToArgumentation}
                disabled={!canAdvanceToArgumentation}
                className="w-full inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Lanjut
              </button>
              {!canAdvanceToArgumentation && (
                <p className="mt-3 text-sm text-neutral-600">Silakan eksplorasi AR dan bertanya ke AI sebelum melanjutkan.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Floating AI */}
      <div>
        {!showAiPanel && (
          <button
            aria-label="Buka AI Assistant"
            onClick={() => setShowAiPanel(true)}
            className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl"
          >
            🤖
          </button>
        )}

        {showAiPanel && (
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-3xl border border-neutral-200 bg-white p-4 shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-neutral-900">Halo — AI Assistant</h4>
                <p className="mt-1 text-sm text-neutral-600">Tanyakan sesuatu tentang objek ini.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAiPanel(false)} className="rounded-full border border-neutral-200 px-3 py-2 text-sm">Tutup</button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <button key={q} type="button" onClick={() => void handleSend(q)} disabled={isResponding} className="rounded-full border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-700">{q}</button>
              ))}
            </div>

            <div className="mt-4">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Ketik pertanyaan singkat..." className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => void handleSend()} disabled={isResponding || !draft.trim()} className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white">{isResponding ? 'Memproses...' : 'Kirim'}</button>
                <button onClick={() => { setDraft(''); setMessages(starterMessages); }} className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700">Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
