'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { init } from 'pptx-preview';
import { BANGUN_RUANG_MODULE } from './module';

type PptxViewerProps = {
  initialSlide: number;
  onSlideRead: (slideNumber: number, totalSlides: number) => void;
  onComplete: (totalSlides: number) => void;
  onResetProgress: (totalSlides: number) => void;
};

type RenderedDimensions = { width: number; height: number };

const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2, 2.5];

function removeRenderedSlides(container: HTMLDivElement | null) {
  container?.querySelectorAll('.pptx-preview-slide-wrapper').forEach((slide) => slide.remove());
}

function renderActiveSlide(previewer: ReturnType<typeof init>, container: HTMLDivElement | null, slideIndex: number) {
  if (!container) return;
  removeRenderedSlides(container);
  previewer.renderSingleSlide(slideIndex);
}

function touchDistance(touches: TouchList) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

function nearestZoom(value: number) {
  return ZOOM_LEVELS.reduce((nearest, level) =>
    Math.abs(level - value) < Math.abs(nearest - value) ? level : nearest
  );
}

export default function PptxViewer({ initialSlide, onSlideRead, onComplete, onResetProgress }: PptxViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const slideViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<ReturnType<typeof init> | null>(null);
  const presentationRef = useRef<ArrayBuffer | null>(null);
  const presentationAspectRatioRef = useRef(16 / 9);
  const responsiveRenderFrameRef = useRef<number | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const initialSlideRef = useRef(initialSlide);
  const currentSlideRef = useRef(initialSlide);
  const renderVersionRef = useRef(0);
  const zoomRef = useRef(1);
  const renderedDimensionsRef = useRef<RenderedDimensions>({ width: 1, height: 1 });
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [slideAspectRatio, setSlideAspectRatio] = useState(16 / 9);
  const [renderedDimensions, setRenderedDimensions] = useState<RenderedDimensions>({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);

  const getViewerOptions = useCallback((aspectRatio = presentationAspectRatioRef.current) => {
    const width = Math.max(slideViewportRef.current?.clientWidth ?? 1, 1);
    const height = Math.max(slideViewportRef.current?.clientHeight ?? 1, 1);
    const slideWidth = Math.min(width, Math.round(height * aspectRatio));
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
    const actualAspectRatio = previewer.pptx.width / previewer.pptx.height;
    presentationAspectRatioRef.current = actualAspectRatio;
    setSlideAspectRatio(actualAspectRatio);
    const viewerOptions = getViewerOptions(actualAspectRatio);
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

    renderedDimensionsRef.current = { width: viewerOptions.width, height: viewerOptions.height };
    setRenderedDimensions(renderedDimensionsRef.current);
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
      if (zoomFrameRef.current !== null) {
        window.cancelAnimationFrame(zoomFrameRef.current);
        zoomFrameRef.current = null;
      }
    };
  }, [scheduleResponsiveRender]);

  const setZoomAtPoint = useCallback((nextZoom: number, focusX?: number, focusY?: number) => {
    const viewport = slideViewportRef.current;
    const previousZoom = zoomRef.current;
    if (!viewport || nextZoom === previousZoom) return;

    const dimensions = renderedDimensionsRef.current;
    const pointX = focusX ?? viewport.clientWidth / 2;
    const pointY = focusY ?? viewport.clientHeight / 2;
    const previousCanvasWidth = Math.max(viewport.clientWidth, dimensions.width * previousZoom);
    const previousCanvasHeight = Math.max(viewport.clientHeight, dimensions.height * previousZoom);
    const previousOffsetX = (previousCanvasWidth - dimensions.width * previousZoom) / 2;
    const previousOffsetY = (previousCanvasHeight - dimensions.height * previousZoom) / 2;
    const slidePointX = (viewport.scrollLeft + pointX - previousOffsetX) / previousZoom;
    const slidePointY = (viewport.scrollTop + pointY - previousOffsetY) / previousZoom;

    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    if (zoomFrameRef.current !== null) window.cancelAnimationFrame(zoomFrameRef.current);
    zoomFrameRef.current = window.requestAnimationFrame(() => {
      zoomFrameRef.current = null;
      const nextDimensions = renderedDimensionsRef.current;
      const nextCanvasWidth = Math.max(viewport.clientWidth, nextDimensions.width * nextZoom);
      const nextCanvasHeight = Math.max(viewport.clientHeight, nextDimensions.height * nextZoom);
      const nextOffsetX = (nextCanvasWidth - nextDimensions.width * nextZoom) / 2;
      const nextOffsetY = (nextCanvasHeight - nextDimensions.height * nextZoom) / 2;
      viewport.scrollLeft = Math.max(0, Math.min(
        nextOffsetX + (slidePointX / dimensions.width) * nextDimensions.width * nextZoom - pointX,
        nextCanvasWidth - viewport.clientWidth
      ));
      viewport.scrollTop = Math.max(0, Math.min(
        nextOffsetY + (slidePointY / dimensions.height) * nextDimensions.height * nextZoom - pointY,
        nextCanvasHeight - viewport.clientHeight
      ));
    });
  }, []);

  useEffect(() => {
    const viewport = slideViewportRef.current;
    if (!viewport) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchRef.current = { distance: touchDistance(event.touches), zoom: zoomRef.current };
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      const pinch = pinchRef.current;
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const focusX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
      const focusY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
      setZoomAtPoint(nearestZoom(pinch.zoom * touchDistance(event.touches) / pinch.distance), focusX, focusY);
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchRef.current = null;
    };

    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);
    viewport.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [setZoomAtPoint]);

  const renderSlide = (nextSlide: number, notifyProgress = true) => {
    const previewer = previewerRef.current;
    if (!previewer || nextSlide < 0 || nextSlide >= totalSlides) return;
    currentSlideRef.current = nextSlide;
    renderActiveSlide(previewer, containerRef.current, nextSlide);
    setCurrentSlide(nextSlide);
    if (notifyProgress) onSlideRead(nextSlide + 1, totalSlides);
  };

  const resetLearning = () => {
    renderSlide(0, false);
    if (zoomFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomFrameRef.current);
      zoomFrameRef.current = null;
    }
    zoomRef.current = 1;
    setZoom(1);
    slideViewportRef.current?.scrollTo({ left: 0, top: 0 });
    onResetProgress(totalSlides);
    setShowResetPrompt(false);
  };

  const enterFullscreen = async () => {
    if (!viewerRef.current) return;
    setFullscreenError(false);

    if (document.fullscreenElement) return;

    try {
      await viewerRef.current.requestFullscreen();
    } catch {
      setFullscreenError(true);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = slideViewportRef.current;
    if (!viewport || event.pointerType !== 'mouse' || zoom <= 1) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const viewport = slideViewportRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !viewport) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const zoomIndex = ZOOM_LEVELS.indexOf(zoom);
  const canvasWidth = Math.max(renderedDimensions.width * zoom, slideViewportRef.current?.clientWidth ?? 0);
  const canvasHeight = Math.max(renderedDimensions.height * zoom, slideViewportRef.current?.clientHeight ?? 0);

  return (
    <section
      ref={viewerRef}
      className={`relative flex h-auto w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[20px] bg-[#102F5B] p-2 shadow-[0_14px_36px_rgba(16,47,91,0.16)] sm:p-3 ${isFullscreen ? 'h-dvh max-h-dvh rounded-none p-2' : ''}`}
      aria-label="PPT viewer"
    >
      <div
        ref={slideViewportRef}
        style={isFullscreen ? undefined : { aspectRatio: slideAspectRatio }}
        className={`relative flex min-h-0 min-w-0 items-center justify-center overflow-auto overscroll-contain rounded-[14px] bg-[#DDEBFA] touch-pan-x touch-pan-y ${isFullscreen ? 'flex-1' : 'w-full'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div style={{ width: canvasWidth, height: canvasHeight }} className="relative grid shrink-0 place-items-center">
          <div style={{ width: renderedDimensions.width * zoom, height: renderedDimensions.height * zoom }} className="relative shrink-0">
            <div
              ref={containerRef}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: renderedDimensions.width,
                height: renderedDimensions.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p className="text-sm font-semibold text-[#365576]">Menyiapkan materi...</p></div>}
        {error && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p role="alert" className="px-6 text-center text-sm font-semibold text-[#A52A2A]">{error}</p></div>}
      </div>

      <div className="mt-2 flex shrink-0 items-center justify-center gap-4 text-white" aria-label="Kontrol zoom slide">
        <button type="button" onClick={() => setZoomAtPoint(ZOOM_LEVELS[Math.max(zoomIndex - 1, 0)])} disabled={loading || zoomIndex <= 0} aria-label="Perkecil slide" className="min-h-11 min-w-11 rounded-full bg-white/15 text-2xl font-bold leading-none disabled:cursor-not-allowed disabled:opacity-40">−</button>
        <span className="min-w-12 text-center text-sm font-bold tabular-nums">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoomAtPoint(ZOOM_LEVELS[Math.min(zoomIndex + 1, ZOOM_LEVELS.length - 1)])} disabled={loading || zoomIndex >= ZOOM_LEVELS.length - 1} aria-label="Perbesar slide" className="min-h-11 min-w-11 rounded-full bg-white/15 text-2xl font-bold leading-none disabled:cursor-not-allowed disabled:opacity-40">+</button>
      </div>

      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-white">
        <button type="button" onClick={() => renderSlide(currentSlideRef.current - 1)} disabled={loading || currentSlide <= 0} className="min-h-11 rounded-full bg-white/15 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm">Sebelumnya</button>
        <span className="text-sm font-bold tabular-nums">{totalSlides ? `${currentSlide + 1} / ${totalSlides}` : '- / -'}</span>
        <button type="button" onClick={() => renderSlide(currentSlideRef.current + 1)} disabled={loading || currentSlide >= totalSlides - 1} className="min-h-11 rounded-full bg-[#0DBF7E] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm">Berikutnya</button>
      </div>

      <div className="mt-2 flex shrink-0 items-center justify-between gap-3">
        <button type="button" onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())} disabled={loading} className="min-h-11 text-xs font-bold text-white/80 underline underline-offset-4 disabled:opacity-40">{isFullscreen ? '⛶ Keluar Layar Penuh' : '⛶ Layar Penuh'}</button>
        <button type="button" onClick={() => onComplete(totalSlides)} disabled={loading || !totalSlides || currentSlide + 1 !== totalSlides} className="min-h-11 rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#102F5B] disabled:cursor-not-allowed disabled:opacity-40">Selesai</button>
      </div>

      <div className="mt-2 flex shrink-0 justify-start">
        <button type="button" onClick={() => setShowResetPrompt(true)} disabled={loading || !totalSlides} className="min-h-11 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40">↻ Reset Pembelajaran</button>
      </div>

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