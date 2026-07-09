'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toDataURL } from 'qrcode';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import type { Comic } from '@/types/comic';
import { resolvePreviewImagePath } from './navigationStage.helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function isSketchfab(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('sketchfab.com') || host.includes('skfb.ly');
  } catch {
    return false;
  }
}

function toEmbedUrl(url: string): string {
  // https://sketchfab.com/3d-models/slug-ID  →  https://sketchfab.com/models/ID/embed
  try {
    const u = new URL(url);
    if (u.hostname.includes('sketchfab.com')) {
      const parts = u.pathname.split('-');
      const id = parts[parts.length - 1];
      return `https://sketchfab.com/models/${id}/embed?autostart=1&ui_hint=0&ui_watermark=0`;
    }
  } catch { /* fall through */ }
  return url;
}

// ─── Quick questions ──────────────────────────────────────────────────────────

function getQuickQuestions(title: string): string[] {
  const t = title.toLowerCase();
  if (t.includes('candi jawi')) return [
    'Apa saja bangun ruang yang dapat ditemukan pada Candi Jawi?',
    'Bagian mana yang berbentuk kubus?',
    'Bagian mana yang berbentuk balok?',
    'Bagian mana yang menyerupai limas?',
    'Mengapa bangunan candi tersusun dari beberapa bangun ruang?',
  ];
  if (t.includes('kubus')) return [
    'Apa nama bangun ruang ini?',
    'Berapa jumlah sisinya?',
    'Berapa jumlah rusuknya?',
    'Berapa titik sudutnya?',
    'Mengapa bagian kaki Candi Jawi berbentuk kubus?',
  ];
  if (t.includes('balok')) return [
    'Apa ciri-ciri balok?',
    'Apa perbedaan balok dan kubus?',
    'Berapa jumlah sisi balok?',
    'Bagian mana pada Candi Jawi berbentuk balok?',
  ];
  if (t.includes('limas')) return [
    'Apa ciri-ciri limas?',
    'Berapa jumlah sisi limas segi empat?',
    'Mengapa atap candi menyerupai limas?',
    'Apa perbedaan limas dan prisma?',
  ];
  if (t.includes('prisma')) return [
    'Apa ciri-ciri prisma?',
    'Berapa jumlah sisi prisma segitiga?',
    'Di mana kita bisa melihat bentuk prisma di Candi Jawi?',
    'Apa perbedaan prisma dan balok?',
  ];
  if (t.includes('kerucut')) return [
    'Apa ciri khas alas kerucut?',
    'Apa perbedaan kerucut dan tabung?',
    'Mengapa puncak candi mirip kerucut?',
    'Berapa jumlah sisi kerucut?',
  ];
  if (t.includes('tabung')) return [
    'Apa bentuk alas dan tutup tabung?',
    'Berapa jumlah rusuk tabung?',
    'Mengapa struktur ini sering muncul pada bangunan?',
  ];
  return [
    'Apa nama bangun ruang ini?',
    'Berapa jumlah rusuknya?',
    'Bagaimana bentuk sisi-sisinya?',
    'Apa kaitannya dengan Candi Jawi?',
  ];
}

// ─── System prompt hint ───────────────────────────────────────────────────────

function getSystemPromptHint(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('candi jawi')) {
    return (
      'Kamu adalah fasilitator observasi Candi Jawi. ' +
      'JANGAN langsung menyebutkan nama bangun ruang. ' +
      'Bantu siswa menemukan sendiri bangun ruang yang tersembunyi di arsitektur Candi Jawi ' +
      'dengan pertanyaan pemandu. Jelaskan sejarah singkat dan fungsi Candi Jawi jika ditanya. ' +
      'Arahkan siswa untuk mengamati bagian kubus, balok, limas, prisma, dan kerucut.'
    );
  }
  return (
    `Kamu adalah AI Tutor untuk bangun ruang ${title}. ` +
    'Bantu siswa memahami ciri-ciri, sifat, dan kaitannya dengan Candi Jawi. ' +
    'Jawab pertanyaan dengan jelas dan tambahkan satu pertanyaan reflektif. Maksimal 100 kata.'
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

// ─── ObjectAiPanel ────────────────────────────────────────────────────────────

/* eslint-disable @next/next/no-img-element */
function ObjectAiPanel({ entry, comic }: { entry: ComicAssetEntry; comic: Comic }) {
  const objectTitle = entry.title?.trim() || 'Bangun Ruang';
  const quickQuestions = useMemo(() => getQuickQuestions(objectTitle), [objectTitle]);
  const systemHint = useMemo(() => getSystemPromptHint(objectTitle), [objectTitle]);
  const isCandiJawi = objectTitle.toLowerCase().includes('candi jawi');

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 1,
    role: 'assistant',
    content: isCandiJawi
      ? 'Halo! Kamu sudah melihat model 3D Candi Jawi. Coba amati dengan teliti — bagian mana yang menarik perhatianmu?'
      : `Halo! Kamu sudah mengeksplorasi model ${objectTitle}. Ada yang ingin kamu tanyakan?`,
  }]);
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  const handleSend = useCallback(async (rawText?: string) => {
    const trimmed = (rawText ?? draft).trim();
    if (!trimmed || isResponding) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft('');
    setIsResponding(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/chat', {
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
            sessionHistory: nextMessages.map(({ role, content }) => ({ role, content })),
            comicTitle: comic.title,
            pageLabel: `Halaman ${entry.page}`,
            objectName: objectTitle,
            learningStage: 'Navigation',
            systemHint,
          },
        }),
      });
      const payload = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !payload.answer) throw new Error(payload.error ?? 'AI tidak merespons.');
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: payload.answer! }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg);
      setMessages((prev) => [...prev, { id: Date.now() + 2, role: 'assistant', content: `Maaf, terjadi kesalahan: ${msg}` }]);
    } finally {
      setIsResponding(false);
    }
  }, [comic, draft, entry.page, isResponding, messages, objectTitle, systemHint]);

  return (
    <div className="overflow-hidden rounded-[20px] border border-primary-100 bg-gradient-to-b from-[#F5FBFF] to-white shadow-[0_4px_16px_rgba(47,128,237,0.08)]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#EBF5FF] to-[#F5FBFF] px-4 py-3">
        <div className={['flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/80 shadow-[0_4px_12px_rgba(47,128,237,0.15)]', isResponding ? 'animate-ai-blink' : 'animate-ai-float'].join(' ')}>
          <img src="/images/ai/robot.svg" alt="AI Tutor" className="h-8 w-8 drop-shadow-sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-primary-600">AI Tutor</p>
          <p className="truncate text-sm font-bold text-neutral-700">{objectTitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={['h-2 w-2 rounded-full', isResponding ? 'animate-pulse bg-secondary-500' : 'bg-accent-500'].join(' ')} />
          <span className="text-xs font-semibold text-neutral-400">{isResponding ? 'Berpikir...' : 'Siap'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* Messages */}
        <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
              <div className={['max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed', msg.role === 'user' ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm border border-primary-100 bg-[#F5FBFF] text-neutral-800'].join(' ')}>
                {msg.content}
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-primary-100 bg-[#F5FBFF] px-3 py-2.5">
                {[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick questions */}
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q) => (
            <button key={q} type="button" onClick={() => void handleSend(q)} disabled={isResponding}
              className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            rows={2}
            placeholder="Tulis pertanyaanmu..."
            className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button type="button" onClick={() => void handleSend()} disabled={isResponding || !draft.trim()}
            className="mb-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-[0_4px_12px_rgba(47,128,237,0.28)] transition hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
            aria-label="Kirim pertanyaan">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {aiError && <p className="rounded-2xl border border-error-200 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700">{aiError}</p>}
      </div>
    </div>
  );
}

// ─── ObjectCard ───────────────────────────────────────────────────────────────

interface ObjectCardProps {
  entry: ComicAssetEntry;
  index: number;
  explored: boolean;
  comic: Comic;
  onExplored: (entryId: string) => void;
}

function ObjectCard({ entry, index, explored, comic, onExplored }: ObjectCardProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState<string | null>(null);
  const objectTitle = entry.title?.trim() || 'Bangun Ruang';
  const valid = isValidUrl(entry.url);
  const sketchfab = valid && isSketchfab(entry.url);
  const embedUrl = sketchfab ? toEmbedUrl(entry.url) : null;
  const previewImage = entry.previewImage?.trim() || resolvePreviewImagePath(objectTitle);
  const qrSource = (entry.qrUrl || entry.url || '').trim();
  const id = `${entry.page}-${entry.url}`;

  useEffect(() => {
    if (!isQrOpen || !qrSource) {
      setQrDataUrl('');
      setQrError(null);
      return;
    }

    let isMounted = true;
    toDataURL(qrSource, { margin: 1, scale: 10 })
      .then((dataUrl) => {
        if (isMounted) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (isMounted) {
          setQrDataUrl('');
          setQrError('QR tidak dapat dibuat saat ini.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isQrOpen, qrSource]);

  function handleIframeLoad() {
    onExplored(id);
  }

  function handleExternalOpen() {
    onExplored(id);
    window.open(entry.url, '_blank', 'noopener,noreferrer');
  }

  function handleQrOpen() {
    if (!qrSource) return;
    onExplored(id);
    setIsQrOpen(true);
  }

  return (
    <div className={['overflow-hidden rounded-[20px] border shadow-sm transition-all duration-200', explored ? 'border-accent-200' : 'border-neutral-200'].join(' ')}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 bg-white px-4 py-3">
        <div className={['flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black', explored ? 'bg-accent-500 text-white' : 'bg-primary-100 text-primary-700'].join(' ')}>
          {explored ? '✓' : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {index === 0 ? 'Objek Utama' : `Objek ${index + 1}`}
          </p>
          <h3 className="truncate text-base font-black text-neutral-900">{objectTitle}</h3>
        </div>
        {explored && (
          <span className="flex-shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-700">
            ✓ Selesai
          </span>
        )}
      </div>

      {sketchfab && embedUrl ? (
        <div className="relative w-full bg-neutral-900" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
          <iframe
            src={embedUrl}
            title={`Model 3D ${objectTitle}`}
            onLoad={handleIframeLoad}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : valid ? (
        <div className="border-t border-neutral-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="overflow-hidden rounded-[18px] border border-neutral-200 bg-neutral-100">
            {previewImage ? (
              <img
                src={previewImage}
                alt={`Preview ${objectTitle}`}
                className="h-48 w-full object-cover sm:h-56"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-50 text-sm font-semibold text-primary-700 sm:h-56">
                Preview model akan tampil di sini.
              </div>
            )}
          </div>

          {entry.description && (
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{entry.description}</p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleExternalOpen}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
            >
              <span>📦</span> Lihat Model 3D
            </button>
            <button
              type="button"
              onClick={handleQrOpen}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-black text-neutral-700 transition hover:bg-neutral-100 active:scale-[0.98]"
            >
              <span>📱</span> Lihat QR
            </button>
          </div>

          <div className="mt-4">
            <ObjectAiPanel entry={entry} comic={comic} />
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 px-4 py-6 text-center">
          <p className="text-sm text-neutral-400">Model 3D belum tersedia.</p>
        </div>
      )}

      {sketchfab && valid && (
        <div className="flex justify-end bg-white px-4 py-2">
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2H2v12h12v-4M10 2h4v4M10 6l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Buka Fullscreen
          </a>
        </div>
      )}

      {isQrOpen && qrSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-md rounded-[24px] border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-600">QR Assemblr</p>
                <h4 className="mt-1 text-lg font-black text-neutral-900">{objectTitle}</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQrOpen(false)}
                className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR ${objectTitle}`} className="mx-auto h-60 w-60 rounded-2xl bg-white p-3 object-contain" />
              ) : (
                <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3 text-center text-sm font-semibold text-neutral-500">
                  {qrError || 'Membuat QR...'}
                </div>
              )}
              <div className="mt-4 space-y-2 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-700">Model</p>
                <p>{objectTitle}</p>
                <p className="font-semibold text-neutral-700">Link</p>
                <p className="break-all text-xs text-neutral-500">{qrSource}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${objectTitle.toLowerCase().replace(/\s+/g, '-') || 'qr'}-assemblr.png`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-black text-white"
                >
                  Download QR
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsQrOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NavigationStage ──────────────────────────────────────────────────────────

export default function NavigationStage() {
  const { comic, setCanAdvance, unregisterSlideNav } = useLearningEngine();
  const metadata = useComicMetadata(comic.id);
  const { model3D } = metadata.assets;

  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());

  const requiredIds = useMemo(
    () => model3D.filter((e) => isValidUrl(e.url)).map((e) => `${e.page}-${e.url}`),
    [model3D],
  );

  const canAdvance = requiredIds.length > 0 && requiredIds.every((id) => exploredIds.has(id));

  useEffect(() => { setCanAdvance(canAdvance); }, [canAdvance, setCanAdvance]);
  useEffect(() => () => { unregisterSlideNav(); }, [unregisterSlideNav]);

  const handleExplored = useCallback((id: string) => {
    setExploredIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden animate-fade-in-up">

      {/* Stage header */}
      <header className="rounded-[24px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
            🧭
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-600">
              Navigation · AR + AI
            </p>
            <h2 className="mt-0.5 text-base font-black leading-snug text-neutral-900 sm:text-lg">
              Amati setiap model 3D, lalu diskusikan dengan AI Tutor.
            </h2>
          </div>
        </div>
      </header>

      {/* Object cards */}
      {model3D.length > 0 ? (
        <div className="flex flex-col gap-4">
          {model3D.map((entry, index) => (
            <ObjectCard
              key={`${entry.page}-${entry.url}`}
              entry={entry}
              index={index}
              explored={exploredIds.has(`${entry.page}-${entry.url}`)}
              comic={comic}
              onExplored={handleExplored}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-500">
            Objek AR belum tersedia untuk komik ini.
          </p>
        </div>
      )}

      {/* Progress footer */}
      <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-600">Progress eksplorasi</p>
          <span className="text-sm font-black text-primary-700">
            {exploredIds.size}/{requiredIds.length} objek
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
            style={{ width: requiredIds.length > 0 ? `${(exploredIds.size / requiredIds.length) * 100}%` : '0%' }}
          />
        </div>
        {!canAdvance && (
          <p className="mt-2 text-xs text-neutral-500">
            Muat semua model 3D ({exploredIds.size}/{requiredIds.length}) untuk melanjutkan. AI Tutor bersifat opsional.
          </p>
        )}
      </div>
    </div>
  );
}
