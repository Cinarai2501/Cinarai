'use client';

import { useEffect, useRef, useState } from 'react';
import { init } from 'pptx-preview';
import { BANGUN_RUANG_MODULE } from './module';

type PptxViewerProps = {
  initialSlide: number;
  onSlideRead: (slideNumber: number, totalSlides: number) => void;
  onComplete: (totalSlides: number) => void;
};

export default function PptxViewer({ initialSlide, onSlideRead, onComplete }: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<ReturnType<typeof init> | null>(null);
  const [slideNumber, setSlideNumber] = useState(initialSlide + 1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const previewer = init(containerRef.current, { width: 960, height: 540, mode: 'slide' });
        previewerRef.current = previewer;
        await previewer.load(file);
        if (cancelled) return;

        const count = previewer.slideCount;
        const safeSlide = Math.min(Math.max(initialSlide, 0), Math.max(count - 1, 0));
        setTotalSlides(count);
        setSlideNumber(safeSlide + 1);
        previewer.renderSingleSlide(safeSlide);
        onSlideRead(safeSlide + 1, count);
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
  }, [initialSlide, onSlideRead]);

  const renderSlide = (nextSlide: number) => {
    const previewer = previewerRef.current;
    if (!previewer || nextSlide < 0 || nextSlide >= totalSlides) return;
    previewer.renderSingleSlide(nextSlide);
    setSlideNumber(nextSlide + 1);
    onSlideRead(nextSlide + 1, totalSlides);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  return (
    <section className="w-full overflow-hidden rounded-[24px] bg-[#102F5B] p-3 shadow-[0_14px_36px_rgba(16,47,91,0.16)] sm:p-4" aria-label="PPT viewer">
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[16px] bg-[#DDEBFA] sm:min-h-[360px]">
        {loading && <p className="text-sm font-semibold text-[#365576]">Menyiapkan materi...</p>}
        {error && <p role="alert" className="px-6 text-center text-sm font-semibold text-[#A52A2A]">{error}</p>}
        <div ref={containerRef} className={`h-full w-full overflow-hidden ${loading || error ? 'hidden' : ''}`} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-white">
        <button type="button" onClick={() => renderSlide(slideNumber - 2)} disabled={loading || slideNumber <= 1} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
        <span className="text-sm font-bold tabular-nums">{totalSlides ? `${slideNumber} / ${totalSlides}` : '- / -'}</span>
        <button type="button" onClick={() => renderSlide(slideNumber)} disabled={loading || slideNumber >= totalSlides} className="rounded-full bg-[#0DBF7E] px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button type="button" onClick={() => void toggleFullscreen()} disabled={loading} className="text-xs font-bold text-white/80 underline underline-offset-4 disabled:opacity-40">Layar penuh</button>
        <button type="button" onClick={() => onComplete(totalSlides)} disabled={loading || !totalSlides || slideNumber !== totalSlides} className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#102F5B] disabled:cursor-not-allowed disabled:opacity-40">Selesai</button>
      </div>
    </section>
  );
}