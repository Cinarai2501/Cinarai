'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import { useSnackbar } from '@/context/SnackbarContext';
// `useAuth` intentionally not used here (kept authentication & data flows intact elsewhere)
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
  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());
  const [showEmbed, setShowEmbed] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Progress gate: all model3D entries must be explored.
  // AI interaction is optional and never blocks advancement.
  const requiredIds = useMemo(
    () => model3D.filter((e) => isValidUrl(e.url)).map((e) => `${e.page}-${e.url}`),
    [model3D],
  );
  const allObjectsExplored = requiredIds.length > 0 && requiredIds.every((id) => exploredIds.has(id));
  const canAdvanceToArgumentation = allObjectsExplored;

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
    console.info('[Navigation] Navigation State — canAdvance:', canAdvanceToArgumentation, 'exploredIds:', exploredIds.size, '/', requiredIds.length);
  }, [canAdvanceToArgumentation, exploredIds.size, requiredIds.length, setCanAdvance]);

  // Separate cleanup effect: unregister slide nav only on unmount.
  // Must not be co-located with setCanAdvance — otherwise the cleanup fires
  // on every canAdvanceToArgumentation change, not just on unmount.
  useEffect(() => {
    return () => { unregisterSlideNav(); };
  }, [unregisterSlideNav]);

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

    console.info('[Navigation] AI Request Start — question:', trimmed);

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    const historyForPrompt = nextMessages.map(({ role, content }) => ({ role, content }));

    setMessages(nextMessages);
    setDraft('');
    setIsResponding(true);
    setAiError(null);

    try {
      console.info('[NavigationStage] Navigation -> /api/ai/chat', {
        question: trimmed,
        objectName: activeObjectName,
      });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          context: {
            moduleName: comic.title,
            identification: [],
            objectInfo: {
              location: comic.lokasi,
              classLevel: comic.kelas,
              synopsis: comic.synopsis,
              learningTargets: comic.learningTargets,
            },
            observationAnswers: {},
            sessionHistory: historyForPrompt,
            comicTitle: comic.title,
            pageLabel: primaryEntry ? `Halaman ${primaryEntry.page}` : undefined,
            objectName: activeObjectName,
            learningStage: 'Navigation',
          },
        }),
      });

      const payload = await response.json() as { answer?: string; provider?: string; error?: string };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? 'AI response was not available.');
      }

      // AI response received — purely informational, does not affect stage progress.
      console.info('[Navigation] AI Response Success — provider:', payload.provider, 'length:', payload.answer.length);
      console.info('[NavigationStage] Navigation received:', {
        provider: payload.provider,
        answerLength: payload.answer.length,
      });

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: payload.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[NavigationStage] Gagal memanggil AI', error);
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Navigation] Error:', msg);
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

    // Mark this entry as explored regardless of how it opens.
    const entryId = `${entry.page}-${entry.url}`;
    setExploredIds((prev) => {
      if (prev.has(entryId)) return prev;
      const next = new Set(prev);
      next.add(entryId);
      console.info('[Navigation] AR explored:', entry.title, '— exploredIds:', next.size, '/', requiredIds.length);
      return next;
    });

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
      const remaining = requiredIds.length - exploredIds.size;
      showSnackbar(
        remaining === 1
          ? 'Silakan eksplorasi 1 objek AR lagi sebelum melanjutkan.'
          : `Silakan eksplorasi ${remaining} objek AR lagi sebelum melanjutkan.`,
        'info',
      );
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

            {/* AR object list — one button per model3D entry */}
            <div className="mt-4 flex flex-col gap-2">
              {model3D.length > 0 ? (
                model3D.map((entry) => {
                  const entryId = `${entry.page}-${entry.url}`;
                  const explored = exploredIds.has(entryId);
                  const valid = isValidUrl(entry.url);
                  return (
                    <div key={entryId} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenAr(entry)}
                        disabled={!valid}
                        className={[
                          'inline-flex min-h-[44px] flex-1 items-center justify-between rounded-2xl border px-4 py-2 text-sm font-semibold transition',
                          explored
                            ? 'border-accent-300 bg-accent-50 text-accent-700'
                            : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50',
                        ].join(' ')}
                      >
                        <span>{entry.title || 'Lihat AR Interaktif'}</span>
                        {explored && <span className="ml-2 text-accent-600">✓</span>}
                      </button>
                    </div>
                  );
                })
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-400 cursor-not-allowed"
                >
                  Objek AR belum tersedia
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
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
                <p className="mt-3 text-sm text-neutral-600">
                  {requiredIds.length > 1
                    ? `Eksplorasi semua objek AR (${exploredIds.size}/${requiredIds.length}) untuk melanjutkan.`
                    : 'Buka viewer AR untuk melanjutkan.'}
                </p>
              )}
            </div>
          </div>
        </section>

        <aside
          aria-label="AI Assistant"
          className="flex flex-col gap-0 overflow-hidden rounded-[24px] border border-primary-100 bg-gradient-to-b from-[#F5FBFF] to-white shadow-[0_8px_32px_rgba(47,128,237,0.10)]"
        >
          {/* Robot hero area */}
          <div className="relative flex flex-col items-center bg-gradient-to-b from-[#EBF5FF] to-[#F5FBFF] px-5 pb-4 pt-6">
            {/* Bubble chat */}
            <div className="relative mb-3 max-w-[240px] rounded-[18px] border border-primary-100 bg-white px-4 py-2.5 text-center text-sm font-semibold leading-snug text-primary-700 shadow-[0_4px_16px_rgba(47,128,237,0.12)]">
              Tanyakan apa saja tentang bangun ruang atau Candi Jawi!
              {/* Bubble tail */}
              <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 h-0 w-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-white" />
              <span className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 h-0 w-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-primary-100" style={{ zIndex: -1 }} />
            </div>

            {/* Robot */}
            <button
              type="button"
              aria-label="AI Assistant"
              className="group mt-1 cursor-pointer select-none rounded-full border-0 bg-transparent p-0 focus:outline-none"
            >
              <div className={[
                'flex h-28 w-28 items-center justify-center rounded-full bg-white/70 shadow-[0_12px_40px_rgba(47,128,237,0.18)] transition-transform duration-150 ease-out',
                'group-hover:scale-105 group-active:scale-95',
                isResponding ? 'animate-ai-blink' : 'animate-ai-float',
              ].join(' ')}>
                <img
                  src="/images/ai/robot.svg"
                  alt="Robot AI CINARAI"
                  width={96}
                  height={96}
                  className="h-24 w-24 drop-shadow-md"
                />
              </div>
            </button>

            {/* Status badge */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className={['h-2 w-2 rounded-full', isResponding ? 'animate-pulse bg-secondary-500' : 'bg-accent-500'].join(' ')} />
              <span className="text-xs font-semibold text-neutral-500">
                {isResponding ? 'Sedang berpikir...' : 'Siap membantu!'}
              </span>
            </div>
          </div>

          {/* Chat + input area */}
          <div className="flex flex-col gap-3 p-4">
            {/* Chat messages */}
            {messages.length > 0 && (
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
                  >
                    <div className={[
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-primary-600 text-white'
                        : 'rounded-bl-sm border border-primary-100 bg-[#F5FBFF] text-neutral-800',
                    ].join(' ')}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isResponding && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-primary-100 bg-[#F5FBFF] px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick questions */}
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void handleSend(q)}
                  disabled={isResponding}
                  className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                rows={2}
                placeholder="Tulis pertanyaanmu..."
                className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isResponding || !draft.trim()}
                className="mb-0.5 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-[0_4px_16px_rgba(47,128,237,0.30)] transition hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
                aria-label="Kirim pertanyaan"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {aiError && (
              <div className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
                Terjadi error: {aiError}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
