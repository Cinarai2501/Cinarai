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
  const [showEmbed, setShowEmbed] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  // Auto-load Sketchfab embeds when the primary entry is a Sketchfab model
  useEffect(() => {
    if (!primaryEntry || !primaryEntry.url) return;
    try {
      const parsed = new URL(primaryEntry.url);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('sketchfab.com') || host.includes('skfb.ly')) {
        setShowEmbed(true);
      }
    } catch {
      // ignore
    }
  }, [primaryEntry]);

  // Rotate/Zoom controls removed — Sketchfab provides built-in gestures

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
    setAiError(null);

    try {
      const response = await generateTutorResponse(
        {
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
        },
        undefined,
        { throwOnError: true },
      );

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[NavigationStage] Gagal memanggil AI', error);
      const msg = error instanceof Error ? error.message : String(error);
      setAiError(msg);
      const fallbackMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `Maaf, terjadi kesalahan saat menghubungi layanan AI: ${msg}`,
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <div className="overflow-hidden rounded-[18px] border border-neutral-200 bg-white">
              {showEmbed && primaryEntry ? (
                <div className="h-64 w-full sm:h-80">
                  <iframe src={`${primaryEntry.url.replace(/\/$/, '')}/embed`} title={`Model 3D ${activeObjectName}`} className="h-full w-full border-0" allow="fullscreen" />
                </div>
              ) : previewSrc ? (
                <div className="h-56 w-full overflow-hidden sm:h-72">
                  <img
                    src={previewSrc}
                    alt={`Tampilan ${activeObjectName} dalam AR`}
                    className="h-full w-full object-cover"
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
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Eksplorasi model 3D dan ajukan pertanyaan kepada AI untuk memahami objek ini.</p>
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
                onClick={() => showSnackbar(comic.synopsis || 'Tidak ada info lebih lanjut.', 'info')}
                className="ml-auto inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
              >
                Info
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

        <aside className="rounded-[24px] border border-primary-100 bg-gradient-to-br from-white via-primary-50 to-secondary-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex w-full flex-col items-center">
              <div className="mb-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-center text-sm font-semibold text-primary-700 shadow-sm">
                Tanyakan apa saja tentang bangun ruang atau Candi Jawi!
              </div>
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/80 p-2 shadow-[0_12px_36px_rgba(43,140,255,0.18)]"
                style={{
                  animation: isResponding ? 'aiBlink 1.2s ease-in-out infinite' : 'aiFloat 2s ease-in-out infinite',
                }}
              >
                <img src="/images/ai/robot.svg" alt="AI Assistant robot" className="h-20 w-20" />
              </div>
            </div>

            <div className="w-full rounded-[22px] border border-primary-100 bg-white/90 p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q) => (
                  <button key={q} type="button" onClick={() => void handleSend(q)} disabled={isResponding} className="rounded-full border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700">
                    {q}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={3}
                  placeholder="Tulis pertanyaanmu..."
                  className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-neutral-500">
                    {isResponding ? 'Robot sedang berpikir...' : 'Robot siap membantu'}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isResponding || !draft.trim()}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    aria-label="Kirim pertanyaan"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="mt-3 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
                  Terjadi error pada layanan AI: {aiError}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @keyframes aiFloat {
          0%,
          100% {
            transform: translateY(-4px);
          }
          50% {
            transform: translateY(0);
          }
        }

        @keyframes aiBlink {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  );
}
