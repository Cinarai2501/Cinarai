'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { init } from 'pptx-preview';
import { BANGUN_RUANG_MODULE } from './module';

type PptxViewerProps = {
  initialSlide: number;
  onSlideRead: (slideNumber: number, totalSlides: number) => void;
  onComplete: (totalSlides: number) => void;
};

export default function PptxViewer({ initialSlide, onSlideRead, onComplete }: PptxViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<ReturnType<typeof init> | null>(null);
  const presentationRef = useRef<ArrayBuffer | null>(null);
  const initialSlideRef = useRef(initialSlide);
  const currentSlideRef = useRef(initialSlide);
  const [slideNumber, setSlideNumber] = useState(initialSlide + 1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLearningPrompt, setShowLearningPrompt] = useState(true);
  const [orientationFallback, setOrientationFallback] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);

  const getViewerOptions = useCallback(() => {
    const width = Math.max(containerRef.current?.clientWidth ?? 1, 1);
    const height = Math.max(containerRef.current?.clientHeight ?? Math.round(width * (9 / 16)), 1);
    const slideWidth = Math.min(width, Math.round(height * (16 / 9)));

    return {
      width: Math.max(slideWidth, 1),
      height,
      mode: 'slide' as const,
    };
  }, []);

  const renderPresentation = useCallback(async (file: ArrayBuffer, slideIndex: number, notifyProgress: boolean) => {
    if (!containerRef.current) return;

    previewerRef.current?.destroy();
    const previewer = init(containerRef.current, getViewerOptions());
    previewerRef.current = previewer;
    await previewer.load(file);

    const count = previewer.slideCount;
    const safeSlide = Math.min(Math.max(slideIndex, 0), Math.max(count - 1, 0));
    currentSlideRef.current = safeSlide;
    setTotalSlides(count);
    setSlideNumber(safeSlide + 1);
    previewer.renderSingleSlide(safeSlide);
    if (notifyProgress) onSlideRead(safeSlide + 1, count);
  }, [getViewerOptions, onSlideRead]);

  useEffect(() => {
    let cancelled = false;

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
      previewerRef.current?.destroy();
      previewerRef.current = null;
    };
  }, [renderPresentation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === viewerRef.current;
      setIsFullscreen(nextIsFullscreen);
      if (!nextIsFullscreen) setOrientationFallback(false);

      if (presentationRef.current) {
        window.requestAnimationFrame(() => {
          void renderPresentation(presentationRef.current!, currentSlideRef.current, false);
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [renderPresentation]);

  const renderSlide = (nextSlide: number) => {
    const previewer = previewerRef.current;
    if (!previewer || nextSlide < 0 || nextSlide >= totalSlides) return;
    currentSlideRef.current = nextSlide;
    previewer.renderSingleSlide(nextSlide);
    setSlideNumber(nextSlide + 1);
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
      <div className={`relative min-h-0 min-w-0 overflow-hidden rounded-[16px] bg-[#DDEBFA] [&_.pptx-preview-slide-wrapper]:!m-0 [&_.pptx-preview-wrapper]:!h-full [&_.pptx-preview-wrapper]:!w-full [&_.pptx-preview-wrapper]:!overflow-hidden ${isFullscreen ? 'flex-1' : 'aspect-[16/9] w-full'}`}>
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p className="text-sm font-semibold text-[#365576]">Menyiapkan materi...</p></div>}
        {error && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#DDEBFA]"><p role="alert" className="px-6 text-center text-sm font-semibold text-[#A52A2A]">{error}</p></div>}
        <div ref={containerRef} className="absolute inset-0 h-full w-full min-w-0 overflow-hidden overscroll-contain touch-pan-x touch-pan-y" />
      </div>

      {orientationFallback && isFullscreen && <p className="mt-2 text-center text-xs font-semibold text-white/75">Putar perangkat ke posisi mendatar untuk melihat materi dengan jelas.</p>}

      <div className="mt-3 flex shrink-0 items-center justify-between gap-2 text-white">
        <button type="button" onClick={() => renderSlide(slideNumber - 2)} disabled={loading || slideNumber <= 1} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
        <span className="text-sm font-bold tabular-nums">{totalSlides ? `${slideNumber} / ${totalSlides}` : '- / -'}</span>
        <button type="button" onClick={() => renderSlide(slideNumber)} disabled={loading || slideNumber >= totalSlides} className="rounded-full bg-[#0DBF7E] px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between gap-3">
        <button type="button" onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())} disabled={loading} className="text-xs font-bold text-white/80 underline underline-offset-4 disabled:opacity-40">{isFullscreen ? '⛶ Keluar Layar Penuh' : '⛶ Layar Penuh'}</button>
        <button type="button" onClick={() => onComplete(totalSlides)} disabled={loading || !totalSlides || slideNumber !== totalSlides} className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#102F5B] disabled:cursor-not-allowed disabled:opacity-40">Selesai</button>
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