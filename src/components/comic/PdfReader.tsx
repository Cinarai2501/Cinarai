"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const MAX_PAGE_WIDTH = 1000;
const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;

// Height of the bottom nav bar (mobile/tablet) — used in fit calculation
// 56px button + 12px pt + 12px pb + 1px border ≈ 81px; use 88 for safety
const BOTTOM_NAV_H = 88;

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
  const [userScale, setUserScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  // true when viewport is lg+ (≥1024px) — side-nav mode
  const [isDesktop, setIsDesktop] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // ── Worker ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  // ── Measure viewport + detect desktop breakpoint ───────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      setViewportWidth(w);
      setViewportHeight(h);
      setIsDesktop(w >= 1024);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset aspect ratio on page change
  useEffect(() => { setPageAspectRatio(null); }, [page]);

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
  const zoomIn  = useCallback(() => setUserScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setUserScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN)), []);
  const resetZoom = useCallback(() => setUserScale(1), []);

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

  // ── Capture actual page aspect ratio ──────────────────────────────────────
  const pageRef = useRef<HTMLDivElement>(null);
  const onPageRenderSuccess = useCallback(() => {
    const canvas = pageRef.current?.querySelector("canvas");
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      setPageAspectRatio(canvas.width / canvas.height);
    }
  }, []);

  // ── Fit-to-contain width calculation ──────────────────────────────────────
  // Desktop (isDesktop): no bottom bar — full viewport height available.
  //   PADDING_V = 24px (py-3 top+bottom of scroll area)
  // Mobile/tablet: bottom bar takes BOTTOM_NAV_H.
  //   PADDING_V = 24 + BOTTOM_NAV_H
  //
  // baseWidth = min(fitByWidth, fitByHeight, MAX_PAGE_WIDTH)
  const PADDING_V = isDesktop ? 24 : 24 + BOTTOM_NAV_H;
  const availW = Math.max(viewportWidth || 320, 1);
  const availH = Math.max((viewportHeight || 600) - PADDING_V, 100);

  let baseWidth: number;
  if (pageAspectRatio !== null && pageAspectRatio > 0) {
    baseWidth = Math.min(availW, availH * pageAspectRatio, MAX_PAGE_WIDTH);
  } else {
    baseWidth = Math.min(availW, MAX_PAGE_WIDTH);
  }

  const pageWidth = Math.round(Math.max(baseWidth * userScale, 100));

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

  // ── Complete button (last page) ────────────────────────────────────────────
  const completeButton = isLastPage && showCompleteButton && onComplete ? (
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
  ) : null;

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
              🔍 {Math.round(userScale * 100)}%
            </button>
          </div>

          <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {showZoom && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
              <button onClick={zoomOut} disabled={userScale <= ZOOM_MIN}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 font-black text-lg disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                aria-label="Perkecil">−</button>
              <button onClick={resetZoom}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-black hover:bg-neutral-200 transition-colors"
                aria-label="Ukuran normal">Normal</button>
              <button onClick={zoomIn} disabled={userScale >= ZOOM_MAX}
                className="flex-1 h-9 rounded-xl bg-neutral-100 text-neutral-700 font-black text-lg disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                aria-label="Perbesar">+</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PDF viewport ─────────────────────────────────────────────────────── */}
      {/*
        Mobile/tablet: viewport is flex-1, bottom nav is flex-shrink-0 below.
        Desktop (lg+): viewport is flex-1 and fills ALL remaining height.
          Side nav arrows are absolutely positioned inside the viewport.
          Complete button on last page appears as a sticky footer inside viewport.
      */}
      <div
        ref={viewportRef}
        className="relative flex-1 min-h-0 overflow-auto bg-[#f0f7ff] select-none"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* PDF page — centered */}
        <div className="flex flex-col items-center py-3 min-h-full">
          <div ref={pageRef}>
            <Document
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<PdfLoadingSpinner />}
              error={<PdfErrorMessage />}
            >
              <Page
                key={`page_${page}`}
                pageNumber={page}
                width={pageWidth}
                onRenderSuccess={onPageRenderSuccess}
                loading={<PageSkeleton width={pageWidth} aspectRatio={pageAspectRatio} />}
                renderAnnotationLayer
                renderTextLayer
              />
            </Document>
          </div>
        </div>

        {/* ── Desktop: side nav arrows (absolutely positioned) ── */}
        {isDesktop && !completeButton && (
          <>
            {/* Prev — left side */}
            <button
              onClick={() => goTo(page - 1)}
              disabled={isFirstPage}
              aria-label="Halaman sebelumnya"
              className="fixed-side-btn left-0 ml-2 xl:ml-4"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next — right side */}
            <button
              onClick={() => goTo(page + 1)}
              disabled={isLastPage}
              aria-label="Halaman berikutnya"
              className="fixed-side-btn right-0 mr-2 xl:mr-4"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* ── Desktop: complete button as sticky footer inside viewport ── */}
        {isDesktop && completeButton && (
          <div
            className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-neutral-100 px-6 py-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto max-w-[1000px]">
              {completeButton}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile / Tablet bottom nav (hidden on desktop) ───────────────────── */}
      <div
        className="lg:hidden flex-shrink-0 bg-white border-t border-neutral-100"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-[1000px] px-3 pt-3 md:px-6">
          {completeButton ?? (
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

function PageSkeleton({ width, aspectRatio }: { width: number; aspectRatio: number | null }) {
  const height = aspectRatio ? Math.round(width / aspectRatio) : Math.round(width * 1.414);
  return (
    <div
      className="bg-neutral-200 animate-pulse rounded-lg"
      style={{ width, height }}
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
