"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface PdfReaderProps {
  pdfPath: string;
  onComplete?: () => void;
}

export default function PdfReader({ pdfPath, onComplete }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Responsive: measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sync fullscreen state with browser API
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPage(1);
    },
    []
  );

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages)),
    [numPages]
  );

  const zoomIn = () => setScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), ZOOM_MAX));
  const zoomOut = () => setScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN));
  const resetZoom = () => setScale(1);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await fullscreenRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Notify parent when last page reached
  useEffect(() => {
    if (numPages > 0 && page === numPages) onComplete?.();
  }, [page, numPages, onComplete]);

  // Compute page render width: fill container, capped at 900px
  const pageWidth = containerWidth
    ? Math.min(containerWidth - 32, 900) * scale
    : undefined;

  return (
    <div ref={fullscreenRef} className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-gray-800 text-white text-sm flex-shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>
          <span className="min-w-[80px] text-center">
            {numPages > 0 ? `${page} / ${numPages}` : "—"}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= numPages}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= ZOOM_MIN}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Perkecil"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="min-w-[52px] text-center px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= ZOOM_MAX}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Perbesar"
          >
            +
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          aria-label={isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? "⊠" : "⛶"}
        </button>
      </div>

      {/* PDF Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center items-start py-4"
      >
        <Document
          file={pdfPath}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<LoadingSpinner />}
          error={<ErrorMessage />}
          className="flex flex-col items-center"
        >
          <Page
            key={`page_${page}`}
            pageNumber={page}
            width={pageWidth}
            loading={<PageSkeleton width={pageWidth} />}
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>

      {/* Mobile bottom nav */}
      <div className="flex sm:hidden items-center justify-between px-6 py-3 bg-gray-800 text-white flex-shrink-0">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="text-2xl px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <span className="text-sm">{numPages > 0 ? `${page} / ${numPages}` : "—"}</span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= numPages}
          className="text-2xl px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
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
      style={{ width: width ?? 600, height: ((width ?? 600) * 4) / 3 }}
    />
  );
}

function ErrorMessage() {
  return (
    <div className="flex items-center justify-center w-full h-64 text-red-400 text-sm">
      Gagal memuat PDF. Pastikan file tersedia.
    </div>
  );
}
