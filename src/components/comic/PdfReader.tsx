"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

// Minimum horizontal swipe distance (px) to trigger page change
const SWIPE_THRESHOLD = 50;
// Maximum vertical drift (px) allowed — prevents accidental swipe while scrolling
const SWIPE_VERTICAL_LIMIT = 80;

interface PdfReaderProps {
  pdfPath: string;
  /** Called exactly once when the user reaches the last page. */
  onComplete?: () => void;
  /** When true, renders a "Selesaikan Komik" CTA on the last page. */
  showCompleteButton?: boolean;
  /** Label for the complete button. */
  completeButtonLabel?: string;
  /** Callback fired whenever the current page or total pages change. */
  onPageChange?: (page: number, numPages: number) => void;
}

export default function PdfReader({
  pdfPath,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "Selesaikan Komik",
  onPageChange,
}: PdfReaderProps) {
  const [workerReady, setWorkerReady] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Guard: fire onComplete only once per mount
  const completedRef = useRef(false);

  // ── Swipe state ────────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // Track active pointer count to disable swipe during pinch-zoom
  const activePointers = useRef(0);

  // ── Worker setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  // ── Container width observer ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Notify parent of page/total changes ───────────────────────────────────
  useEffect(() => {
    if (numPages > 0) onPageChange?.(page, numPages);
  }, [page, numPages, onPageChange]);

  // ── Complete guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (numPages > 0 && page === numPages && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [page, numPages, onComplete]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages)),
    [numPages]
  );

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn = useCallback(
    () => setScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), ZOOM_MAX)),
    []
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN)),
    []
  );
  const resetZoom = useCallback(() => setScale(1), []);

  // ── Swipe handlers ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    activePointers.current = e.touches.length;
    // Only track single-finger swipe; ignore pinch
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Update pointer count — if a second finger appears mid-gesture, cancel swipe
    if (e.touches.length > 1) {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      activePointers.current = e.touches.length;

      if (touchStartX.current === null || touchStartY.current === null) return;
      // Only act on single-finger lift
      if (e.changedTouches.length !== 1) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      touchStartX.current = null;
      touchStartY.current = null;

      // Ignore if vertical movement is too large (user was scrolling)
      if (Math.abs(dy) > SWIPE_VERTICAL_LIMIT) return;
      // Ignore if horizontal movement is below threshold
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0) {
        // Swipe left → next page
        goTo(page + 1);
      } else {
        // Swipe right → previous page
        goTo(page - 1);
      }
    },
    [goTo, page]
  );

  // ── Document load ──────────────────────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPage(1);
    },
    []
  );

  const baseWidth = containerWidth || 320;
  const pageWidth = baseWidth * scale;
  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">

      {/* ── Top toolbar: zoom only ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1 px-3 py-2 bg-gray-800 text-white flex-shrink-0">
        <button
          onClick={zoomOut}
          disabled={scale <= ZOOM_MIN}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-bold"
          aria-label="Perkecil"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="min-w-[52px] h-10 text-center px-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-bold tabular-nums"
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={zoomIn}
          disabled={scale >= ZOOM_MAX}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-bold"
          aria-label="Perbesar"
        >
          +
        </button>
      </div>

      {/* ── PDF viewport with swipe support ───────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4 select-none"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Document
          file={pdfPath}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<LoadingSpinner />}
          error={<ErrorMessage />}
        >
          <Page
            key={`page_${page}_${scale}`}
            pageNumber={page}
            width={pageWidth}
            loading={<PageSkeleton width={baseWidth} />}
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>

      {/* ── Bottom navigation ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-3 py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {isLastPage && showCompleteButton && onComplete ? (
          /* Last page: full-width complete button */
          <button
            onClick={onComplete}
            className="w-full min-h-[52px] rounded-2xl bg-primary-600 px-4 py-3.5 text-base font-black text-white shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>✅</span> {completeButtonLabel}
          </button>
        ) : (
          /* Normal pages: prev / indicator / next */
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              onClick={() => goTo(page - 1)}
              disabled={isFirstPage}
              aria-label="Halaman sebelumnya"
              className="flex items-center justify-center gap-1.5 min-h-[52px] flex-1 rounded-2xl bg-gray-700 text-white font-bold text-sm hover:bg-gray-600 active:bg-gray-500 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </button>

            {/* Page indicator */}
            <div className="flex flex-col items-center justify-center min-w-[56px] px-1">
              <span className="text-white font-black text-base tabular-nums leading-none">
                {numPages > 0 ? page : "—"}
              </span>
              <span className="text-gray-400 text-[11px] tabular-nums leading-none mt-0.5">
                {numPages > 0 ? `/ ${numPages}` : ""}
              </span>
            </div>

            {/* Next */}
            <button
              onClick={() => goTo(page + 1)}
              disabled={isLastPage}
              aria-label="Halaman berikutnya"
              className="flex items-center justify-center gap-1.5 min-h-[52px] flex-1 rounded-2xl bg-primary-600 text-white font-black text-sm hover:bg-primary-700 active:bg-primary-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-64 text-white">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PageSkeleton({ width }: { width?: number }) {
  return (
    <div
      className="bg-gray-700 animate-pulse rounded"
      style={{ width: width ?? 320, height: ((width ?? 320) * 4) / 3 }}
    />
  );
}

function ErrorMessage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 gap-3 px-4 text-center">
      <span className="text-4xl">🚨</span>
      <p className="text-sm font-semibold text-red-400">Gagal memuat PDF.</p>
      <p className="text-xs text-gray-400">Pastikan koneksi internet kamu stabil dan coba lagi.</p>
    </div>
  );
}
