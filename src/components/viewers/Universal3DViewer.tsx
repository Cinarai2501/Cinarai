'use client';

import { useEffect, useMemo, useState } from 'react';
import { toDataURL } from 'qrcode';
import { useSearchParams } from 'next/navigation';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';

interface Universal3DViewerProps {
  initialUrl?: string;
  initialTitle?: string;
  initialComicId?: string | number | null;
  initialPage?: string | number | null;
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
}: Universal3DViewerProps) {
  const searchParams = useSearchParams();

  const resolvedUrl = initialUrl ?? searchParams.get('url') ?? '';
  const resolvedTitle = initialTitle ?? searchParams.get('title') ?? 'Model 3D';
  const resolvedComicId = initialComicId ?? searchParams.get('comicId') ?? '';
  const resolvedPage = initialPage ?? searchParams.get('page') ?? '';

  const [isPreparing, setIsPreparing] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const isValidUrl = isValidHttpUrl(resolvedUrl);
  const providerInfo = useMemo(() => detectProvider(resolvedUrl), [resolvedUrl]);
  const metadata = useComicMetadata(Number(resolvedComicId) || 0);
  const currentPage = Number(resolvedPage);
  const heroEntry = useMemo(() => {
    if (!metadata?.assets?.model3D?.length) return null;
    if (Number.isFinite(currentPage) && currentPage > 0) {
      return metadata.assets.model3D.find((entry) => entry.page === currentPage) ?? metadata.assets.model3D[0];
    }
    return metadata.assets.model3D[0];
  }, [currentPage, metadata]);
  const qrSource = heroEntry?.url?.trim() ?? '';
  const showQrButton = Boolean(qrSource);

  useEffect(() => {
    setIsPreparing(true);
    const timer = window.setTimeout(() => setIsPreparing(false), 180);
    return () => window.clearTimeout(timer);
  }, [resolvedUrl, providerInfo.embedUrl]);

  useEffect(() => {
    if (!qrSource) {
      setQrDataUrl('');
      return;
    }

    toDataURL(qrSource, { margin: 1, scale: 10 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(''));
  }, [qrSource]);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
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
                <img
                  src={qrDataUrl || undefined}
                  alt={`QR untuk ${resolvedTitle}`}
                  className="h-60 w-60 rounded-2xl bg-white p-3 object-contain"
                />
                <div className="w-full text-left">
                  <p className="text-sm font-semibold text-neutral-700">Model</p>
                  <p className="text-base font-black text-neutral-900">{resolvedTitle}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">Provider</p>
                  <p className="text-base text-neutral-700">{providerInfo.label}</p>
                  {heroEntry?.title ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-neutral-700">Label metadata</p>
                      <p className="text-base text-neutral-700">{heroEntry.title}</p>
                    </>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-neutral-700">Halaman</p>
                  <p className="text-base text-neutral-700">{resolvedPage || heroEntry?.page || '-'}</p>
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
              <h2 className="mt-4 text-xl font-black text-neutral-900">Model ini dipublikasikan di Assemblr.</h2>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">
                Universal 3D Viewer tetap menjadi halaman utama. Anda dapat membuka model langsung di Assemblr untuk pengalaman interaktif penuh.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
                >
                  Buka di Assemblr
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700"
                >
                  Tutup Viewer
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
    </div>
  );
}
