'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { init } from 'pptx-preview';
import { BANGUN_RUANG_MODULE } from './module';

type PptxViewerProps = {
  initialSlide: number;
  onSlideRead: (slideNumber: number, totalSlides: number) => void;
  onComplete: (totalSlides: number) => void;
  onResetProgress: (totalSlides: number) => void;
};

function removeRenderedSlides(container: HTMLDivElement | null) {
  container?.querySelectorAll('.pptx-preview-slide-wrapper').forEach((slide) => slide.remove());
}

function renderActiveSlide(previewer: ReturnType<typeof init>, container: HTMLDivElement | null, slideIndex: number) {
  if (!container) return;
  removeRenderedSlides(container);
  previewer.renderSingleSlide(slideIndex);
}

export default function PptxViewer({ initialSlide, onSlideRead, onComplete, onResetProgress }: PptxViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const slideViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<ReturnType<typeof init> | null>(null);
  const presentationRef = useRef<ArrayBuffer | null>(null);
  const presentationAspectRatioRef = useRef(16 / 9);
  const responsiveRenderFrameRef = useRef<number | null>(null);
  const initialSlideRef = useRef(initialSlide);
  const currentSlideRef = useRef(initialSlide);
  const renderVersionRef = useRef(0);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [orientationWarning, setOrientationWarning] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [slideAspectRatio, setSlideAspectRatio] = useState(16 / 9);
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 1, height: 1 });
  const getViewerOptions = useCallback((aspectRatio = presentationAspectRatioRef.current) => {
    const width = Math.max(slideViewportRef.current?.clientWidth ?? 1, 1);
    const height = Math.max(slideViewportRef.current?.clientHeight ?? 1, 1);
    const isFullscreen = document.fullscreenElement === viewerRef.current;
    const slideWidth = isFullscreen ? Math.min(width, Math.round(height * aspectRatio)) : width;
    const slideHeight = Math.round(slideWidth / aspectRatio);

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
    const initialOptions = getViewerOptions();
    containerRef.current.style.width = `${initialOptions.width}px`;
    containerRef.current.style.height = `${initialOptions.height}px`;
    setRenderedDimensions({ width: initialOptions.width, height: initialOptions.height });
    const previewer = init(containerRef.current, initialOptions);
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
    const actualAspectRatio = previewer.pptx.width / previewer.pptx.height;
    presentationAspectRatioRef.current = actualAspectRatio;
    setSlideAspectRatio(actualAspectRatio);
    const viewerOptions = getViewerOptions(actualAspectRatio);
    containerRef.current.style.width = `${viewerOptions.width}px`;
    containerRef.current.style.height = `${viewerOptions.height}px`;
    setRenderedDimensions({ width: viewerOptions.width, height: viewerOptions.height });
    let activePreviewer = previewer;

    if (viewerOptions.width !== previewer.options.width || viewerOptions.height !== previewer.options.height) {
      previewer.destroy();
      containerRef.current.replaceChildren();
      activePreviewer = init(containerRef.current, viewerOptions);
      previewerRef.current = activePreviewer;
      await activePreviewer.load(file);
      if (renderVersion !== renderVersionRef.current || !containerRef.current) {
        activePreviewer.destroy();
        return;
      }
    }

    renderActiveSlide(activePreviewer, containerRef.current, safeSlide);
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

  const scheduleResponsiveRender = useCallback(() => {
    if (!presentationRef.current || responsiveRenderFrameRef.current !== null) return;
    responsiveRenderFrameRef.current = window.requestAnimationFrame(() => {
      responsiveRenderFrameRef.current = null;
      void renderPresentation(presentationRef.current!, currentSlideRef.current, false);
    });
  }, [renderPresentation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === viewerRef.current;
      setIsFullscreen(nextIsFullscreen);
      if (!nextIsFullscreen) {
        setOrientationWarning(false);
        try {
          screen.orientation?.unlock();
        } catch {
          // Orientation unlock is optional across browsers.
        }
      }
      scheduleResponsiveRender();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', scheduleResponsiveRender);
    window.addEventListener('orientationchange', scheduleResponsiveRender);
    const resizeObserver = new ResizeObserver(scheduleResponsiveRender);
    if (slideViewportRef.current) resizeObserver.observe(slideViewportRef.current);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', scheduleResponsiveRender);
      window.removeEventListener('orientationchange', scheduleResponsiveRender);
      resizeObserver.disconnect();
      if (responsiveRenderFrameRef.current !== null) {
        window.cancelAnimationFrame(responsiveRenderFrameRef.current);
        responsiveRenderFrameRef.current = null;
      }
    };
  }, [scheduleResponsiveRender]);

  const renderSlide = (nextSlide: number, notifyProgress = true) => {
    const previewer = previewerRef.current;
    if (!previewer || nextSlide < 0 || nextSlide >= totalSlides) return;
    currentSlideRef.current = nextSlide;
    renderActiveSlide(previewer, containerRef.current, nextSlide);
    setCurrentSlide(nextSlide);
    if (notifyProgress) onSlideRead(nextSlide + 1, totalSlides);
  };

  const resetLearning = () => {
    currentSlideRef.current = 0;
    setCurrentSlide(0);
    renderVersionRef.current += 1;
    const presentation = presentationRef.current;
    if (presentation) {
      setLoading(true);
      void renderPresentation(presentation, 0, false)
        .catch(() => setError('PPT tidak dapat dibaca. Periksa koneksi lalu coba lagi.'))
        .finally(() => setLoading(false));
    }
    onResetProgress(totalSlides);
    setShowResetPrompt(false);
  };

  const enterFullscreen = async () => {
    if (!viewerRef.current) return;
    setFullscreenError(false);
    setOrientationWarning(false);

    if (document.fullscreenElement) return;

    try {
      await viewerRef.current.requestFullscreen();
    } catch {
      setFullscreenError(true);
      return;
    }

    try {
      const orientation = screen.orientation as (ScreenOrientation & { lock?: (value: 'landscape') => Promise<void> }) | undefined;
      if (orientation?.lock) {
        await orientation.lock('landscape');
      } else {
        setOrientationWarning(true);
      }
    } catch {
      setOrientationWarning(true);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    try {
      screen.orientation?.unlock();
    } catch {
      // Orientation unlock is optional across browsers.
    }
  };

  return (
    <section
      ref={viewerRef}
      className={`relative flex h-auto w-full max-w-full min-w-0 flex-col overflow-hidden bg-[#102F5B] [&:fullscreen]:fixed [&:fullscreen]:inset-0 [&:fullscreen]:z-[9999] [&:fullscreen]:m-0 [&:fullscreen]:h-screen [&:fullscreen]:max-h-none [&:fullscreen]:w-screen [&:fullscreen]:max-w-none [&:fullscreen]:rounded-none [&:fullscreen]:bg-black [&:fullscreen]:p-0 ${isFullscreen ? 'fixed inset-0 z-[9999] m-0 h-screen max-h-none w-screen max-w-none rounded-none bg-black p-0' : ''}`}
      aria-label="PPT viewer"
    >
      <div
        ref={slideViewportRef}
        style={isFullscreen ? undefined : { aspectRatio: slideAspectRatio }}
        className={`relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden ${isFullscreen ? 'absolute inset-0 h-full w-full bg-black' : 'w-full bg-[#DDEBFA]'}`}
      >
        <div ref={containerRef} style={{ width: renderedDimensions.width, height: renderedDimensions.height }} className="relative shrink-0 overflow-hidden [&_.pptx-preview-slide-wrapper]:!m-0 [&_.pptx-preview-slide-wrapper]:!shadow-none" />
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p className="text-sm font-semibold text-[#365576]">Menyiapkan materi...</p></div>}
        {error && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p role="alert" className="px-6 text-center text-sm font-semibold text-[#A52A2A]">{error}</p></div>}
      </div>

      <div className={`flex shrink-0 items-center justify-between gap-2 text-white ${isFullscreen ? 'absolute bottom-11 left-0 right-0 z-20 h-11 px-2' : 'flex-wrap bg-[#102F5B] px-3 py-2'}`}>
        <button type="button" onClick={() => renderSlide(currentSlideRef.current - 1)} disabled={loading || currentSlide <= 0} className={`rounded-full bg-white/15 font-bold disabled:cursor-not-allowed disabled:opacity-40 ${isFullscreen ? 'min-h-11 min-w-11 px-3 py-2 text-xs' : 'min-h-11 px-3 py-2 text-xs sm:px-4 sm:text-sm'}`}>Sebelumnya</button>
        <span className={`rounded-full font-bold tabular-nums ${isFullscreen ? 'bg-[#102F5B]/85 px-2 py-1 text-xs' : 'text-sm'}`}>{totalSlides ? `${currentSlide + 1} / ${totalSlides}` : '- / -'}</span>
        <button type="button" onClick={() => renderSlide(currentSlideRef.current + 1)} disabled={loading || currentSlide >= totalSlides - 1} className={`rounded-full bg-[#0DBF7E] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${isFullscreen ? 'min-h-11 min-w-11 px-3 py-2 text-xs' : 'min-h-11 px-3 py-2 text-xs sm:px-4 sm:text-sm'}`}>Berikutnya</button>
      </div>

      <div className={`flex shrink-0 items-center justify-between gap-2 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 z-20 h-11 px-2' : 'bg-[#102F5B] px-3 py-1'}`}>
        <button type="button" onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())} disabled={loading} className={`font-bold text-white/80 underline underline-offset-4 disabled:opacity-40 ${isFullscreen ? 'min-h-11 rounded-full bg-[#102F5B]/85 px-3 text-xs' : 'min-h-11 text-xs'}`}>{isFullscreen ? '⛶ Keluar Layar Penuh' : '⛶ Layar Penuh'}</button>
        {isFullscreen && orientationWarning && <span role="status" className="min-w-0 truncate rounded-full bg-[#102F5B]/85 px-2 py-1 text-[10px] text-white/90">Putar perangkat ke landscape untuk tampilan terbaik.</span>}
        <button type="button" onClick={() => onComplete(totalSlides)} disabled={loading || !totalSlides || currentSlide + 1 !== totalSlides} className={`rounded-full bg-white font-extrabold text-[#102F5B] disabled:cursor-not-allowed disabled:opacity-40 ${isFullscreen ? 'min-h-11 min-w-11 px-3 py-2 text-xs' : 'min-h-11 px-5 py-2 text-sm'}`}>Selesai</button>
      </div>

      {!isFullscreen && <div className="flex shrink-0 justify-start bg-[#102F5B] px-3 pb-2 pt-1">
        <button type="button" onClick={() => setShowResetPrompt(true)} disabled={loading || !totalSlides} className="min-h-11 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40">↻ Reset Pembelajaran</button>
      </div>}

      {fullscreenError && <p role="alert" className="mt-2 text-center text-xs font-semibold text-[#FCA5A5]">Layar penuh belum tersedia. Anda tetap dapat membaca materi di sini.</p>}

      {showResetPrompt && <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#102F5B]/70 p-5" role="dialog" aria-modal="true" aria-labelledby="ppt-reset-title">
        <div className="w-full max-w-sm rounded-[20px] bg-white p-6 text-center shadow-2xl">
          <p id="ppt-reset-title" className="text-lg font-extrabold text-[#102F5B]">Reset Pembelajaran?</p>
          <p className="mt-3 text-sm leading-6 text-[#536782]">Progress belajar akan kembali ke slide pertama.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={() => setShowResetPrompt(false)} className="min-h-11 rounded-full border border-[#B8C6D9] px-5 py-2 text-sm font-extrabold text-[#365576]">Batal</button>
            <button type="button" onClick={resetLearning} className="min-h-11 rounded-full bg-[#0DBF7E] px-5 py-2 text-sm font-extrabold text-white">Reset</button>
          </div>
        </div>
      </div>}
    </section>
  );
}