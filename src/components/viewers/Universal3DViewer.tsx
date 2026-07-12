'use client';

import { useEffect, useMemo, useState } from 'react';
import { toDataURL } from 'qrcode';
import { useRouter, useSearchParams } from 'next/navigation';

/* eslint-disable @next/next/no-img-element */

interface Universal3DViewerProps {
  initialUrl?: string;
  initialTitle?: string;
  initialComicId?: string | number | null;
  initialPage?: string | number | null;
  initialAiPrompt?: string;
  initialQrImage?: string;
  initialViewMode?: string;
}

type SupportedProvider = 'sketchfab' | 'assemblr' | 'glb' | 'gltf' | 'unknown';

interface ProviderInfo {
  provider: SupportedProvider;
  label: string;
  embedUrl: string;
  canEmbed: boolean;
  openUrl: string;
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function detectProvider(url: string): ProviderInfo {
  if (!isValidHttpUrl(url)) {
    return { provider: 'unknown', label: 'Tidak diketahui', embedUrl: url, canEmbed: false, openUrl: url };
  }

  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (host.includes('sketchfab.com') || host.includes('skfb.ly')) {
    const canonicalUrl = host.includes('sketchfab.com')
      ? url
      : 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac';

    const embedUrl = canonicalUrl.includes('/models/') || canonicalUrl.includes('/3d-models/')
      ? `${canonicalUrl.replace(/\/$/, '')}/embed`
      : canonicalUrl;

    return { provider: 'sketchfab', label: 'Sketchfab', embedUrl, canEmbed: true, openUrl: canonicalUrl };
  }

  if (host.includes('assemblr') || host.includes('asblr.com')) {
    return { provider: 'assemblr', label: 'Assemblr', embedUrl: url, canEmbed: false, openUrl: url };
  }

  if (pathname.endsWith('.glb') || pathname.endsWith('.gltf') || pathname.endsWith('.usdz')) {
    const ext = pathname.endsWith('.glb') ? 'glb' : pathname.endsWith('.gltf') ? 'gltf' : 'usdz';
    return { provider: ext === 'glb' ? 'glb' : ext === 'gltf' ? 'gltf' : 'unknown', label: ext.toUpperCase(), embedUrl: url, canEmbed: true, openUrl: url };
  }

  return { provider: 'unknown', label: 'Tidak diketahui', embedUrl: url, canEmbed: false, openUrl: url };
}

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: number;
  role: ChatRole;
  content: string;
};

const OBJECT_HELP: Record<string, string> = {
  Kubus: 'Kubus adalah bangun ruang dengan 6 sisi persegi yang sama panjang. Di dalam model 3D, kamu bisa melihat bahwa semua rusuknya sama dan bentuknya terlihat seperti kotak.',
  Balok: 'Balok adalah bangun ruang dengan 6 sisi persegi panjang. Pada model 3D, bagian ini memiliki panjang, lebar, dan tinggi berbeda sehingga terlihat seperti peti.',
  Limas: 'Limas adalah bangun ruang dengan alas segi empat dan sisi tegak berbentuk segitiga yang bertemu di satu titik puncak. Di model 3D, bentuknya terlihat runcing di atas.',
  Prisma: 'Prisma adalah bangun ruang dengan dua alas sejajar dan sisi tegak yang sama bentuk. Model 3D prisma biasanya terlihat seperti jembatan dengan ujung sama di kedua sisi.',
  Tabung: 'Tabung adalah bangun ruang dengan dua lingkaran sejajar dan permukaan melengkung di sekelilingnya. Di model 3D, kamu bisa melihat bagian atas dan bawah yang melingkar.',
  Kerucut: 'Kerucut adalah bangun ruang dengan alas lingkaran dan puncak di atas. Model 3D kerucut terlihat seperti es krim tanpa sendok.',
  Bola: 'Bola adalah bangun ruang yang semua titik di permukaannya jaraknya sama dari pusat. Di model 3D, bentuknya bulat sempurna seperti bola ping-pong.',
};

function detectObjectName(resolvedTitle: string, resolvedUrl: string) {
  const normalized = `${resolvedTitle} ${resolvedUrl}`.toLowerCase();
  if (normalized.includes('kubus')) return 'Kubus';
  if (normalized.includes('balok')) return 'Balok';
  if (normalized.includes('limas')) return 'Limas';
  if (normalized.includes('prisma')) return 'Prisma';
  if (normalized.includes('tabung')) return 'Tabung';
  if (normalized.includes('kerucut')) return 'Kerucut';
  if (normalized.includes('bola')) return 'Bola';
  return 'Model 3D';
}

function buildTutorIntro(objectName: string) {
  if (objectName === 'Model 3D') {
    return 'Halo! Aku adalah AI Tutor CINARAI. Aku siap membantu memahami model 3D ini.';
  }

  return `Halo! Aku adalah AI Tutor CINARAI. Aku siap membantu memahami objek ${objectName}.`;
}

function ProviderBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
      {label}
    </span>
  );
}

export default function Universal3DViewer({
  initialUrl,
  initialTitle,
  initialComicId,
  initialPage,
  initialAiPrompt,
  initialQrImage,
  initialViewMode,
}: Universal3DViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const resolvedUrl = initialUrl ?? searchParams.get('url') ?? '';
  const resolvedTitle = initialTitle ?? searchParams.get('title') ?? 'Model 3D';
  const resolvedComicId = initialComicId ?? searchParams.get('comicId') ?? '-';
  const resolvedPage = initialPage ?? searchParams.get('page') ?? '-';
  const resolvedMode = searchParams.get('mode') ?? 'default';
  const resolvedView = searchParams.get('view') ?? initialViewMode ?? 'default';
  const resolvedAiPrompt = initialAiPrompt ?? searchParams.get('aiPrompt') ?? '';
  const resolvedQrImage = initialQrImage ?? searchParams.get('qrImage') ?? '';
  const isDetailExperience = resolvedView === 'object-detail' || resolvedMode === 'detail' || resolvedMode === 'object-detail';
  const showAiTutor = isDetailExperience;

  const [isPreparing, setIsPreparing] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(resolvedMode === 'qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showAiSnackbar, setShowAiSnackbar] = useState(false);
  const [showTipsCard, setShowTipsCard] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isValidUrl = isValidHttpUrl(resolvedUrl);
  const providerInfo = useMemo(() => detectProvider(resolvedUrl), [resolvedUrl]);
  const objectName = useMemo(() => detectObjectName(resolvedTitle, resolvedUrl), [resolvedTitle, resolvedUrl]);
  const objectHelp = resolvedAiPrompt || OBJECT_HELP[objectName] || 'Aku akan membantu menjelaskan bentuk ini dengan bahasa sederhana dan mudah dimengerti.';
  const suggestionChips = useMemo(() => {
    if (resolvedAiPrompt) {
      return ['Apa yang paling penting dari objek ini?', 'Bagaimana kaitannya dengan Candi Jawi?', 'Jelaskan bagian yang paling menarik dari objek ini.'];
    }

    if (objectName === 'Model 3D') {
      return ['Apa itu objek ini?', 'Bagaimana bentuk ini dipakai?', 'Di bagian mana objek ini?'];
    }

    const compareShape = objectName === 'Balok' ? 'Kubus' : 'Balok';
    return [
      `Apa itu ${objectName}?`,
      `Mengapa bagian ini berbentuk ${objectName}?`,
      `Ada berapa sisi ${objectName}?`,
      `Apa bedanya ${objectName} dan ${compareShape}?`,
      `${objectName} berada di bagian mana pada Candi Jawi?`,
    ];
  }, [objectName, resolvedAiPrompt]);
  const qrSource = resolvedQrImage || resolvedUrl;
  const showQrButton = Boolean(resolvedQrImage || (qrSource && isValidUrl));

  useEffect(() => {
    setIsPreparing(true);
    const timer = window.setTimeout(() => setIsPreparing(false), 180);
    return () => window.clearTimeout(timer);
  }, [resolvedUrl, providerInfo.embedUrl]);

  useEffect(() => {
    if (!qrSource || resolvedQrImage) {
      setQrDataUrl(resolvedQrImage);
      setQrLoading(false);
      return;
    }

    setQrLoading(true);
    toDataURL(qrSource, { margin: 1, scale: 10 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => {
        setQrDataUrl('');
      })
      .finally(() => setQrLoading(false));
  }, [qrSource, resolvedQrImage]);

  useEffect(() => {
    if (!isValidUrl) return undefined;

    const showDelay = window.setTimeout(() => setShowAiSnackbar(true), 300);
    const hideSnackbar = window.setTimeout(() => setShowAiSnackbar(false), 3300);
    const showTips = window.setTimeout(() => setShowTipsCard(true), 3600);

    return () => {
      window.clearTimeout(showDelay);
      window.clearTimeout(hideSnackbar);
      window.clearTimeout(showTips);
    };
  }, [isValidUrl, objectName]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenExternal = () => {
    if (typeof window !== 'undefined') {
      window.open(providerInfo.openUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenQr = () => {
    if (showQrButton) {
      setIsQrOpen(true);
    }
  };

  const handleAiOpen = () => {
    setIsAiOpen(true);
    if (aiMessages.length === 0) {
      setAiMessages([{ id: 1, role: 'assistant', content: buildTutorIntro(objectName) }]);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await handleSendAiMessage(suggestion);
  };

  const handleSendAiMessage = async (text?: string) => {
    const message = text?.trim() || aiDraft.trim();
    if (!message || isAiResponding) {
      return;
    }

    setAiError(null);
    setIsAiResponding(true);

    const newMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
    };

    setAiMessages((previous) => [...previous, newMessage]);
    setAiDraft('');

    const response = objectHelp;
    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: `${response} ${message.endsWith('?') ? 'Sekarang aku akan menjawab pertanyaanmu.' : 'Jika kamu ingin tahu lebih banyak, kamu dapat tanya lagi.'}`,
    };

    window.setTimeout(() => {
      setAiMessages((previous) => [...previous, assistantMessage]);
      setIsAiResponding(false);
    }, 250);
  };

  if (!resolvedUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-10 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-3xl">🧊</p>
          <h1 className="mt-4 text-xl font-black text-neutral-900">Model 3D belum tersedia.</h1>
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            Tidak ada tautan model 3D yang dapat dibuka untuk data ini.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
          >
            Tutup Viewer
          </button>
        </div>
      </div>
    );
  }

  if (!isValidUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-10 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-3xl">⚠️</p>
          <h1 className="mt-4 text-xl font-black text-neutral-900">URL model 3D tidak valid.</h1>
          <p className="mt-3 break-all text-base leading-relaxed text-neutral-600">{resolvedUrl}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
          >
            Tutup Viewer
          </button>
        </div>
      </div>
    );
  }

  if (providerInfo.provider === 'unknown') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-10 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-3xl">🧩</p>
          <h1 className="mt-4 text-xl font-black text-neutral-900">Provider model belum didukung.</h1>
          <p className="mt-3 break-all text-base leading-relaxed text-neutral-600">{resolvedUrl}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
          >
            Tutup Viewer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Universal 3D Viewer</p>
            <h1 className="text-lg font-black text-neutral-900">{resolvedTitle}</h1>
            <p className="text-sm text-neutral-500">
              Komik {resolvedComicId} • Halaman {resolvedPage}
            </p>
            <div className="mt-2">
              <ProviderBadge label={providerInfo.label} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-base font-semibold text-primary-700"
            >
              Lihat Model 3D
            </button>
            {showQrButton && (
              <button
                type="button"
                onClick={handleOpenQr}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700"
              >
                Tampilkan QR
              </button>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700"
            >
              Tutup Viewer
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-neutral-100">
        {isQrOpen && showQrButton && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Universal QR Center</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">{resolvedTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrOpen(false)}
                  className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  {qrLoading ? (
                    <div className="h-60 w-60 flex items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    </div>
                  ) : (
                    <img
                      src={resolvedQrImage || qrDataUrl || undefined}
                      alt={`QR untuk ${resolvedTitle}`}
                      className="h-60 w-60 rounded-2xl bg-white p-3 object-contain"
                    />
                  )}
                <div className="w-full text-left">
                  <p className="text-sm font-semibold text-neutral-700">Model</p>
                  <p className="text-base font-black text-neutral-900">{resolvedTitle}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">Provider</p>
                  <p className="text-base text-neutral-700">{providerInfo.label}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">Halaman</p>
                  <p className="text-base text-neutral-700">{resolvedPage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPreparing ? (
          <div className="flex h-full min-h-[320px] items-center justify-center px-6 py-10 text-center">
            <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              <p className="mt-4 text-base font-semibold text-neutral-700">Menyiapkan viewer model 3D…</p>
            </div>
          </div>
        ) : providerInfo.provider === 'assemblr' ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <p className="text-3xl">🧊</p>
              <h2 className="mt-4 text-xl font-black text-neutral-900">
                {isDetailExperience ? 'Objek ini siap dieksplorasi lebih lanjut.' : 'Model ini dipublikasikan di Assemblr.'}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">
                {isDetailExperience
                  ? 'Pilih salah satu tindakan di bawah untuk melihat model 3D, QR, atau menutup pengalaman detail.'
                  : 'Universal 3D Viewer tetap menjadi halaman utama. Anda dapat membuka model langsung di Assemblr untuk pengalaman interaktif penuh.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
                >
                  {isDetailExperience ? 'Buka Model 3D' : 'Buka di Assemblr'}
                </button>
                {showQrButton && (
                  <button
                    type="button"
                    onClick={handleOpenQr}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700"
                  >
                    {isDetailExperience ? 'Lihat QR' : 'Tampilkan QR'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700"
                >
                  {isDetailExperience ? 'Tutup View' : 'Tutup Viewer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={providerInfo.embedUrl}
            title={`Model 3D ${resolvedTitle}`}
            className="h-full min-h-[70vh] w-full border-0"
            loading="eager"
            allow="fullscreen"
          />
        )}
      </div>

      {showAiSnackbar && (
        <div className="fixed bottom-[104px] right-5 z-40 min-w-[240px] max-w-sm rounded-2xl border border-sky-100 bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-opacity duration-200">
          <p className="text-sm font-bold text-sky-700">👋 Halo!</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">Aku siap membantu menjelaskan {objectName}.</p>
        </div>
      )}

      {showAiTutor && (
        <button
          type="button"
          onClick={handleAiOpen}
          className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_12px_25px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-95 sm:bottom-6 sm:right-6"
          aria-label="Buka AI Tutor"
        >
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
            <img src="/images/ai/robot.svg" alt="Robot AI" className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-300 px-1.5 text-[10px] font-black uppercase text-slate-900 shadow-sm">
              AI
            </span>
          </div>
        </button>
      )}

      {showTipsCard && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex items-end justify-center px-4 sm:bottom-6 sm:justify-end">
          <div className="w-full max-w-md rounded-3xl border border-primary-100 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-5 transition-opacity duration-250">
            <div className="flex items-center gap-3 text-sm text-neutral-700">
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 font-semibold text-yellow-800">💡 Tips</span>
              <span>Tekan AI Tutor jika kamu ingin bertanya tentang objek 3D ini.</span>
            </div>
          </div>
        </div>
      )}

      {isAiOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-[420px] sm:rounded-[24px] rounded-t-[24px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.20)]" style={{ maxHeight: '85vh' }}>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-neutral-200 bg-gradient-to-r from-sky-50 via-white to-yellow-50 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-neutral-900">🤖 AI Tutor CINARAI</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Aku siap menemanimu belajar tentang {objectName}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 active:scale-95"
                  aria-label="Tutup AI Tutor"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 rounded-[24px] bg-primary-50 p-4 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Objek</p>
                <p className="mt-2 text-lg font-black text-neutral-900">{objectName}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{objectHelp}</p>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {suggestionChips.slice(0, 5).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void handleSuggestionClick(chip)}
                    className="rounded-full border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === 'assistant'
                        ? 'rounded-[24px] bg-neutral-100 px-4 py-3 text-sm text-neutral-800'
                        : 'ml-auto max-w-[85%] rounded-[24px] bg-primary-600 px-4 py-3 text-sm text-white'
                    }
                  >
                    {message.content}
                  </div>
                ))}

                {isAiResponding && (
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" />
                    <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.08s' }} />
                    <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.16s' }} />
                  </div>
                )}

                {aiError && (
                  <div className="rounded-[20px] border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700">
                    {aiError}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-white p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={aiDraft}
                  onChange={(event) => setAiDraft(event.target.value)}
                  rows={2}
                  placeholder="Tanya AI Tutor tentang objek ini..."
                  className="min-h-[56px] flex-1 resize-none rounded-[20px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSendAiMessage()}
                  disabled={isAiResponding || !aiDraft.trim()}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-50 active:scale-95"
                  aria-label="Kirim pesan AI Tutor"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
