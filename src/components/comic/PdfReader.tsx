"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface PdfReaderProps {
  pdfPath: string;
  /** Called exactly once when the user reaches the last page. */
  onComplete?: () => void;
  /** When true, renders a "Selesaikan Komik" CTA on the last page. */
  showCompleteButton?: boolean;
  /** Label for the complete button. Defaults to "Selesaikan Komik". */
  completeButtonLabel?: string;
}

export default function PdfReader({
  pdfPath,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "Selesaikan Komik",
}: PdfReaderProps) {
  const [workerReady, setWorkerReady] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  // Guard: fire onComplete only once per mount
  const completedRef = useRef(false);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Fire onComplete exactly once when user navigates to the last page
  useEffect(() => {
    if (numPages > 0 && page === numPages && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [page, numPages, onComplete]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPage(1);
    },
    []
  );

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages)),
    [numPages]
  );

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), ZOOM_MAX)),
    []
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN)),
    []
  );
  const resetZoom = useCallback(() => setScale(1), []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await fullscreenRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const baseWidth = containerWidth || 320;
  const pageWidth = baseWidth * scale;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-1 px-2 py-2 bg-gray-800 text-white text-sm flex-shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-lg"
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>
          <span className="min-w-[56px] text-center text-xs tabular-nums">
            {numPages > 0 ? `${page} / ${numPages}` : "—"}
          </span>
          {/* Hide Next on last page when showCompleteButton is active */}
          {!(isLastPage && showCompleteButton) && (
            <button
              onClick={() => goTo(page + 1)}
              disabled={page >= numPages}
              className="w-9 h-9 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-lg"
              aria-label="Halaman berikutnya"
            >
              ›
            </button>
          )}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= ZOOM_MIN}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Perkecil"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="min-w-[44px] h-9 text-center px-1 rounded bg-gray-700 hover:bg-gray-600 text-xs tabular-nums"
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= ZOOM_MAX}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Perbesar"
          >
            +
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
          aria-label={isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? "⊠" : "⛶"}
        </button>
      </div>

      {/* PDF Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
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

      {/* Complete CTA — shown only on last page when enabled */}
      {isLastPage && showCompleteButton && onComplete && (
        <div className="flex-shrink-0 px-4 py-4 bg-gray-800 border-t border-gray-700">
          <button
            onClick={onComplete}
            className="w-full min-h-[52px] rounded-2xl bg-primary-600 px-4 py-3.5 text-base font-black text-white shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>✅</span> {completeButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
}

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
