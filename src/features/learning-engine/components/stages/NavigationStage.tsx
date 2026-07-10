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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalSrc, setQrModalSrc] = useState<string>('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiMinimized, setAiMinimized] = useState(false);

  // Progress gate: all model3D entries must be explored.
  // AI interaction is optional and never blocks advancement.
  const requiredIds = useMemo(
    () => model3D.filter((e) => isValidUrl(e.arUrl)).map((e) => `${e.page}-${e.arUrl}`),
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
    if (!primaryEntry || !primaryEntry.arUrl) return;
    try {
      const parsed = new URL(primaryEntry.arUrl);
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
    if (!isValidUrl(entry.arUrl)) {
      showSnackbar('Link AR belum tersedia.', 'info');
      return;
    }

    // Mark this entry as explored regardless of how it opens.
    const entryId = `${entry.page}-${entry.arUrl}`;
    setExploredIds((prev) => {
      if (prev.has(entryId)) return prev;
      const next = new Set(prev);
      next.add(entryId);
      console.info('[Navigation] AR explored:', entry.title, '— exploredIds:', next.size, '/', requiredIds.length);
      return next;
    });

    // For Sketchfab embedded models, prefer opening embed in-page.
    const url = entry.arUrl;
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
    window.open(entry.arUrl, '_blank', 'noopener,noreferrer');
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
                  <iframe src={`${primaryEntry.arUrl.replace(/\/$/, '')}/embed`} title={`Model 3D ${activeObjectName}`} className="h-full w-full border-0" allow="fullscreen" />
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

            {/* Per-object card list (Photo → Lihat Model 3D → Lihat QR) */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {model3D.length > 0 ? (
                model3D.map((entry, idx) => {
                  const entryId = `${entry.page}-${entry.arUrl}`;
                  const explored = exploredIds.has(entryId);
                  const valid = isValidUrl(entry.arUrl);
                  const candidateQr = entry.qrImage?.trim() || '';
                  const preview = entry.previewImage || `/images/navigation/komik-${comic.id}-ar.png`;

                  function openQr() {
                    setQrModalSrc(candidateQr || '');
                    setQrModalOpen(true);
                    // mark explored when QR is viewed
                    setExploredIds((prev) => new Set(prev).add(entryId));
                  }

                  return (
                    <div key={entryId} className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white p-3">
                      {/* 1. Foto asli bagian Candi Jawi */}
                      <div className="h-40 w-full overflow-hidden rounded-md bg-neutral-100">
                        <img src={preview} alt={entry.title || `Objek ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>

                      {/* 2. Nama objek */}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-neutral-500">{`Objek ${idx + 1}`}</p>
                        <h4 className="truncate text-base font-black text-neutral-900">{entry.title || 'Model 3D'}</h4>
                      </div>

                      {/* 3. Deskripsi singkat */}
                      {entry.description && <p className="mt-2 text-sm text-neutral-600">{entry.description}</p>}

                      {/* 4. Tombol Lihat Model 3D */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenAr(entry)}
                          disabled={!valid}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                        >
                          <span>📦</span>
                          <span>Lihat Model 3D</span>
                        </button>

                        {/* 5. Tombol Lihat QR (menggunakan entry.qrImage saja) */}
                        <button
                          type="button"
                          onClick={openQr}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-100"
                        >
                          <span>📱</span>
                          <span>Lihat QR</span>
                        </button>
                      </div>

                      {explored && <div className="mt-3"><span className="rounded-full bg-accent-100 px-2 py-1 text-xs font-bold text-accent-700">✓ Selesai</span></div>}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">Tidak ada objek AR untuk komik ini.</div>
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

        {/* Floating AI FAB & Chat Panel */}
        <div aria-hidden className="relative">
          {/* FAB (positioned inside the right column to avoid overlapping main nav) */}
          <div>
            {/* FAB: fixed bottom-right, responsive offset so it won't overlap Lanjut on small screens */}
            <div className="fixed right-6 bottom-24 sm:bottom-6 z-50">
              <button
                type="button"
                onClick={() => {
                  setAiPanelOpen((s) => !s);
                  if (aiMinimized) setAiMinimized(false);
                }}
                aria-expanded={aiPanelOpen}
                className="h-14 w-14 rounded-full bg-primary-600 shadow-lg flex items-center justify-center text-white"
              >
                <img src="/images/ai/robot.svg" alt="AI" className="h-8 w-8" />
              </button>
            </div>
          </div>

          {/* Chat panel overlay (absolute so it stays within right column) */}
          {aiPanelOpen && (
            <div className="fixed right-6 bottom-6 z-40 w-full max-w-md transform-gpu rounded-tl-2xl rounded-bl-2xl shadow-xl" style={{ height: aiMinimized ? '4.5rem' : '70vh' }}>
              <div className="h-full w-full rounded-[14px] bg-white border border-neutral-200 shadow-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <img src="/images/ai/robot.svg" alt="AI" className="h-8 w-8" />
                    <div>
                      <p className="text-sm font-bold">AI Tutor</p>
                      <p className="text-xs text-neutral-500">Opsional — minimize atau tutup untuk kembali ke eksplorasi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAiMinimized((s) => !s)} className="text-sm font-semibold text-neutral-600">{aiMinimized ? 'Restore' : 'Minimize'}</button>
                    <button type="button" onClick={() => setAiPanelOpen(false)} className="text-sm font-semibold text-neutral-600">Tutup</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {/* Inline chat panel (uses existing messages/handleSend state) */}
                  {primaryEntry ? (
                    <div className="flex h-full flex-col">
                      <div className="flex-1 overflow-y-auto pr-2">
                        {messages.map((msg) => (
                          <div key={msg.id} className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
                            <div className={['max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed', msg.role === 'user' ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm border border-primary-100 bg-[#F5FBFF] text-neutral-800'].join(' ')}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isResponding && (
                          <div className="mt-2 text-sm text-neutral-500">AI sedang merespons…</div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {quickQuestions.map((q) => (
                            <button key={q} type="button" onClick={() => void handleSend(q)} disabled={isResponding} className="rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-semibold text-primary-700">{q}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm" />
                          <button type="button" onClick={() => void handleSend()} disabled={isResponding || !draft.trim()} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">➤</button>
                        </div>
                        {aiError && <div className="text-sm text-error-700">{aiError}</div>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Pilih objek untuk memulai percakapan.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        {/* QR Modal */}
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="w-full max-w-sm rounded-[20px] border border-neutral-200 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-600">QR Assemblr</p>
                  <h4 className="mt-1 text-lg font-black text-neutral-900">QR Code</h4>
                </div>
                <button type="button" onClick={() => setQrModalOpen(false)} className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700">Tutup</button>
              </div>

              <div className="mt-4 rounded-[12px] border border-neutral-200 bg-neutral-50 p-4 flex items-center justify-center">
                {qrModalSrc ? (
                  // If src looks like an image or data URL, show image; otherwise show link
                  (qrModalSrc.startsWith('data:') || /\.(png|jpe?g|webp|svg)$/i.test(qrModalSrc)) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrModalSrc} alt="QR Code" className="h-60 w-60 object-contain" />
                  ) : (
                    <a href={qrModalSrc} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 underline">Buka QR/Link: {qrModalSrc}</a>
                  )
                ) : (
                  <p className="text-sm text-neutral-500">QR Code tidak tersedia pada metadata untuk objek ini.</p>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
