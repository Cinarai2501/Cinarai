"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const MAX_PAGE_WIDTH = 1000; // cap for desktop — never render wider than this at scale=1
const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;

interface PdfReaderProps {
  pdfPath: string;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
}

export default function PdfReader({
  pdfPath,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onPageChange,
}: PdfReaderProps) {
  const [workerReady, setWorkerReady] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [showZoom, setShowZoom] = useState(false);

  // containerRef measures the full available width of the scroll area
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // ── Worker ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  // ── Measure container width via ResizeObserver ─────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Notify parent ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (numPages > 0) onPageChange?.(page, numPages);
  }, [page, numPages, onPageChange]);

  const isLastPageReached = numPages > 0 && page === numPages;

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages)),
    [numPages]
  );

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn  = useCallback(() => setScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN)), []);
  const resetZoom = useCallback(() => setScale(1), []);

  // ── Swipe ──────────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dy) > SWIPE_VERTICAL_LIMIT) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) goTo(page + 1);
    else goTo(page - 1);
  }, [goTo, page]);

  // ── Document load ──────────────────────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPage(1);
  }, []);

  // ── Responsive page width ──────────────────────────────────────────────────
  // baseWidth = actual container width, capped at MAX_PAGE_WIDTH.
  // pageWidth = baseWidth * scale (zoom applied on top).
  // Falls back to 320 until ResizeObserver fires.
  const baseWidth = Math.min(containerWidth || 320, MAX_PAGE_WIDTH);
  const pageWidth = Math.round(baseWidth * scale);

  const isFirstPage = page <= 1;
  const isLastPage  = isLastPageReached;
  const progressPct = numPages > 0 ? Math.round((page / numPages) * 100) : 0;

  if (!workerReady) {
    return (
      <div className="flex flex-col h-full bg-[#f0f7ff] items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-primary-600">Memuat komik...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f7ff]">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-100">
        <div className="mx-auto w-full max-w-[1000px] px-4 pt-3 pb-2 md:px-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-black text-neutral-700">
              {numPages > 0 ? `📖 Halaman ${page} dari ${numPages}` : "📖 Memuat..."}
            </span>
            <button
              onClick={() => setShowZoom((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-200 transition-colors"
              aria-label="Ubah ukuran"
            >
              🔍 {Math.round(scale * 100)}%
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Zoom controls */}
          {showZoom && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
              <button
                onClick={zoomOut}
                disabled={scale <= ZOOM_MIN}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 font-black text-lg disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                aria-label="Perkecil"
              >−</button>
              <button
                onClick={resetZoom}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-black hover:bg-neutral-200 transition-colors"
                aria-label="Ukuran normal"
              >Normal</button>
              <button
                onClick={zoomIn}
                disabled={scale >= ZOOM_MAX}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 font-black text-lg disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                aria-label="Perbesar"
              >+</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PDF viewport ─────────────────────────────────────────────────────── */}
      {/*
        containerRef measures the full scroll-area width.
        The inner wrapper centers the page and constrains it to max-w-[1000px].
        overflow-x-auto allows horizontal scroll only when zoomed beyond container.
      */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto bg-[#f0f7ff] select-none"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col items-center py-3 min-h-full">
          <Document
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<PdfLoadingSpinner />}
            error={<PdfErrorMessage />}
          >
            <Page
              key={`page_${page}_${scale}`}
              pageNumber={page}
              width={pageWidth}
              loading={<PageSkeleton width={pageWidth} />}
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        </div>
      </div>

      {/* ── Bottom navigation ────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-white border-t border-neutral-100"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-[1000px] px-3 pt-3 md:px-6">
          {isLastPage && showCompleteButton && onComplete ? (
            <button
              onClick={() => onCompleteRef.current?.()}
              disabled={completeButtonDisabled}
              className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3.5 text-lg font-black text-white shadow-md hover:from-green-600 hover:to-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {completeButtonDisabled
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                : completeButtonLabel
              }
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(page - 1)}
                disabled={isFirstPage}
                aria-label="Halaman sebelumnya"
                className="flex items-center justify-center gap-1.5 min-h-[56px] flex-1 rounded-2xl bg-neutral-100 text-neutral-700 font-black text-base hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Sebelumnya
              </button>

              <button
                onClick={() => goTo(page + 1)}
                disabled={isLastPage}
                aria-label="Halaman berikutnya"
                className="flex items-center justify-center gap-1.5 min-h-[56px] flex-1 rounded-2xl bg-primary-600 text-white font-black text-base hover:bg-primary-700 active:bg-primary-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Selanjutnya
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PdfLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 gap-3">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-neutral-500">Memuat halaman...</p>
    </div>
  );
}

function PageSkeleton({ width }: { width: number }) {
  // A4 aspect ratio ≈ 1:1.414
  return (
    <div
      className="bg-neutral-200 animate-pulse rounded-lg"
      style={{ width, height: Math.round(width * 1.414) }}
    />
  );
}

function PdfErrorMessage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 gap-3 px-6 text-center">
      <span className="text-5xl">😕</span>
      <p className="text-base font-black text-neutral-700">Komik tidak bisa dimuat</p>
      <p className="text-sm text-neutral-500 leading-relaxed">
        Periksa koneksi internet kamu, lalu coba lagi ya!
      </p>
    </div>
  );
}
