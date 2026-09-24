'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { init } from 'pptx-preview';
import { BANGUN_RUANG_MODULE } from './module';

type PptxViewerProps = {
  initialSlide: number;
  onSlideRead: (slideNumber: number, totalSlides: number) => void;
  onComplete: (totalSlides: number) => void;
};

function removeRenderedSlides(container: HTMLDivElement | null) {
  container?.querySelectorAll('.pptx-preview-slide-wrapper').forEach((slide) => slide.remove());
}

function renderActiveSlide(previewer: ReturnType<typeof init>, container: HTMLDivElement | null, slideIndex: number) {
  removeRenderedSlides(container);
  previewer.renderSingleSlide(slideIndex);
  removeRenderedSlides(container);
}

export default function PptxViewer({ initialSlide, onSlideRead, onComplete }: PptxViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<ReturnType<typeof init> | null>(null);
  const presentationRef = useRef<ArrayBuffer | null>(null);
  const initialSlideRef = useRef(initialSlide);
  const currentSlideRef = useRef(initialSlide);
  const renderVersionRef = useRef(0);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLearningPrompt, setShowLearningPrompt] = useState(true);
  const [orientationFallback, setOrientationFallback] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);

  const getViewerOptions = useCallback((slideAspectRatio = 16 / 9) => {
    const width = Math.max(containerRef.current?.clientWidth ?? 1, 1);
    const height = Math.max(containerRef.current?.clientHeight ?? Math.round(width * (9 / 16)), 1);
    const slideWidth = Math.min(width, Math.round(height * slideAspectRatio));
    const slideHeight = Math.round(slideWidth / slideAspectRatio);

    return {
      width: Math.max(slideWidth, 1),
      height: Math.max(slideHeight, 1),
      mode: 'slide' as const,
    };
  }, []);

  const renderPresentation = useCallback(async (file: ArrayBuffer, slideIndex: number, notifyProgress: boolean) => {
    if (!containerRef.current) return;
    const renderVersion = ++renderVersionRef.current;

    previewerRef.current?.destroy();
    containerRef.current.replaceChildren();
    const previewer = init(containerRef.current, getViewerOptions());
    previewerRef.current = previewer;
    await previewer.load(file);

    if (renderVersion !== renderVersionRef.current || !containerRef.current) {
      previewer.destroy();
      return;
    }

    const count = previewer.slideCount;
    const safeSlide = Math.min(Math.max(slideIndex, 0), Math.max(count - 1, 0));
    currentSlideRef.current = safeSlide;
    setCurrentSlide(safeSlide);
    setTotalSlides(count);
    const slideAspectRatio = previewer.pptx.width / previewer.pptx.height;
    const viewerOptions = getViewerOptions(slideAspectRatio);
    if (viewerOptions.width !== previewer.options.width || viewerOptions.height !== previewer.options.height) {
      previewer.destroy();
      containerRef.current.replaceChildren();
      const resizedPreviewer = init(containerRef.current, viewerOptions);
      previewerRef.current = resizedPreviewer;
      await resizedPreviewer.load(file);
      if (renderVersion !== renderVersionRef.current || !containerRef.current) {
        resizedPreviewer.destroy();
        return;
      }
      renderActiveSlide(resizedPreviewer, containerRef.current, safeSlide);
    } else {
      renderActiveSlide(previewer, containerRef.current, safeSlide);
    }
    if (notifyProgress) onSlideRead(safeSlide + 1, count);
  }, [getViewerOptions, onSlideRead]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    async function loadPresentation() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(BANGUN_RUANG_MODULE.assetPath);
        if (!response.ok) throw new Error('File PPT tidak dapat dimuat.');
        const file = await response.arrayBuffer();
        if (cancelled || !containerRef.current) return;
        presentationRef.current = file;
        await renderPresentation(file, initialSlideRef.current, true);
        if (cancelled) return;
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError('PPT tidak dapat dibaca. Periksa koneksi lalu coba lagi.');
        }
      }
    }

    void loadPresentation();
    return () => {
      cancelled = true;
      renderVersionRef.current += 1;
      previewerRef.current?.destroy();
      previewerRef.current = null;
      container?.replaceChildren();
    };
  }, [renderPresentation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === viewerRef.current;
      setIsFullscreen(nextIsFullscreen);
      if (!nextIsFullscreen) setOrientationFallback(false);

      if (presentationRef.current) {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          void renderPresentation(presentationRef.current!, currentSlideRef.current, false);
        }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    const handleResize = () => {
      if (document.fullscreenElement !== viewerRef.current || !presentationRef.current) return;
      window.requestAnimationFrame(() => {
        void renderPresentation(presentationRef.current!, currentSlideRef.current, false);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderPresentation]);

  const renderSlide = (nextSlide: number) => {
    const previewer = previewerRef.current;
    if (!previewer || nextSlide < 0 || nextSlide >= totalSlides) return;
    currentSlideRef.current = nextSlide;
    renderActiveSlide(previewer, containerRef.current, nextSlide);
    setCurrentSlide(nextSlide);
    onSlideRead(nextSlide + 1, totalSlides);
  };

  const enterFullscreen = async () => {
    if (!viewerRef.current) return;
    setFullscreenError(false);

    if (document.fullscreenElement) {
      return;
    }

    try {
      await viewerRef.current.requestFullscreen();
      setShowLearningPrompt(false);

      const orientation = window.screen.orientation as ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };
      if (orientation?.lock) {
        try {
          await orientation.lock('landscape');
        } catch {
          setOrientationFallback(true);
        }
      } else {
        setOrientationFallback(true);
      }
    } catch {
      setFullscreenError(true);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  };

  return (
    <section
      ref={viewerRef}
      className={`relative flex w-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-[#102F5B] p-3 shadow-[0_14px_36px_rgba(16,47,91,0.16)] sm:p-4 ${isFullscreen ? 'h-dvh rounded-none p-2 sm:p-3' : ''}`}
      aria-label="PPT viewer"
    >
      <div className={`relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#DDEBFA] [&_.pptx-preview-slide-wrapper]:!m-0 ${isFullscreen ? 'flex-1' : 'aspect-[16/9] w-full'}`}>
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p className="text-sm font-semibold text-[#365576]">Menyiapkan materi...</p></div>}
        {error && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p role="alert" className="px-6 text-center text-sm font-semibold text-[#A52A2A]">{error}</p></div>}
        <div ref={containerRef} className="absolute inset-0 flex h-full w-full min-w-0 items-center justify-center overflow-hidden overscroll-contain touch-pan-x touch-pan-y" />
      </div>

      {orientationFallback && isFullscreen && <p className="mt-2 text-center text-xs font-semibold text-white/75">Putar perangkat ke posisi mendatar untuk melihat materi dengan jelas.</p>}

      <div className="mt-3 flex shrink-0 items-center justify-between gap-2 text-white">
        <button type="button" onClick={() => renderSlide(currentSlideRef.current - 1)} disabled={loading || currentSlide <= 0} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
        <span className="text-sm font-bold tabular-nums">{totalSlides ? `${currentSlide + 1} / ${totalSlides}` : '- / -'}</span>
        <button type="button" onClick={() => renderSlide(currentSlideRef.current + 1)} disabled={loading || currentSlide >= totalSlides - 1} className="rounded-full bg-[#0DBF7E] px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between gap-3">
        <button type="button" onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())} disabled={loading} className="text-xs font-bold text-white/80 underline underline-offset-4 disabled:opacity-40">{isFullscreen ? '⛶ Keluar Layar Penuh' : '⛶ Layar Penuh'}</button>
        <button type="button" onClick={() => onComplete(totalSlides)} disabled={loading || !totalSlides || currentSlide + 1 !== totalSlides} className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#102F5B] disabled:cursor-not-allowed disabled:opacity-40">Selesai</button>
      </div>

      {showLearningPrompt && !isFullscreen && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102F5B]/70 p-5" role="dialog" aria-modal="true" aria-labelledby="ppt-learning-mode-title">
        <div className="w-full max-w-sm rounded-[20px] bg-white p-6 text-center shadow-2xl">
          <p id="ppt-learning-mode-title" className="text-lg font-extrabold text-[#102F5B]">📘 Mode Belajar</p>
          <p className="mt-3 text-sm leading-6 text-[#536782]">Agar materi terlihat jelas, gunakan layar penuh dalam posisi lanskap.</p>
          <button type="button" onClick={() => void enterFullscreen()} disabled={loading} className="mt-5 inline-flex items-center justify-center rounded-full bg-[#0DBF7E] px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">🔄 Layar Penuh</button>
          {fullscreenError && <p role="alert" className="mt-3 text-xs font-semibold text-[#A52A2A]">Layar penuh belum tersedia. Anda tetap dapat membaca materi di sini.</p>}
        </div>
      </div>}
    </section>
  );
}