"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  const updateContainerWidth = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setContainerWidth(Math.max(0, Math.floor(rect.width)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateContainerWidth();
    });
    ro.observe(el);

    updateContainerWidth();

    const mediaQuery = window.matchMedia("(orientation: landscape)");
    const handleOrientationChange = () => updateContainerWidth();

    mediaQuery.addEventListener?.("change", handleOrientationChange);
    window.addEventListener("resize", updateContainerWidth);
    window.addEventListener("orientationchange", updateContainerWidth);

    return () => {
      ro.disconnect();
      mediaQuery.removeEventListener?.("change", handleOrientationChange);
      window.removeEventListener("resize", updateContainerWidth);
      window.removeEventListener("orientationchange", updateContainerWidth);
    };
  }, [updateContainerWidth]);

  useEffect(() => {
    if (numPages > 0) onPageChange?.(page, numPages);
  }, [page, numPages, onPageChange]);

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages)),
    [numPages]
  );

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

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPage(1);
  }, []);

  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;
  const progressPct = numPages > 0 ? Math.round((page / numPages) * 100) : 0;
  const pageWidth = useMemo(() => {
    if (containerWidth <= 0) return 0;
    return containerWidth;
  }, [containerWidth]);

  if (!workerReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f5f7fa]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm font-semibold text-primary-700">Memuat komik...</p>
      </div>
    );
  }

  const completeButton = isLastPage && showCompleteButton && onComplete ? (
    <button
      onClick={() => onCompleteRef.current?.()}
      disabled={completeButtonDisabled}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-base font-black text-white shadow-md transition-all hover:from-green-600 hover:to-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {completeButtonDisabled ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Menyimpan...
        </>
      ) : (
        completeButtonLabel
      )}
    </button>
  ) : null;

  return (
    <div className="flex h-full flex-col bg-[#f5f7fa]">
      <div className="flex flex-shrink-0 items-center gap-3 bg-white px-3 py-2 shadow-sm">
        <span className="flex-shrink-0 text-sm font-bold text-neutral-700 tabular-nums">
          {numPages > 0 ? `${page} / ${numPages}` : "…"}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-[#f5f7fa] px-2 py-3 sm:px-3 md:px-4"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto flex w-full max-w-full flex-col items-center">
          <Document
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<PdfLoadingSpinner />}
            error={<PdfErrorMessage />}
          >
            <div className="my-4 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex justify-center overflow-hidden">
                <div className="w-full max-w-full min-w-0" style={{ width: "100%", maxWidth: "100%" }}>
                  <Page
                    key={`page_${page}`}
                    pageNumber={page}
                    width={pageWidth || undefined}
                    className="w-full max-w-full"
                    loading={pageWidth > 0 ? <PageSkeleton width={pageWidth} /> : null}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              </div>
            </div>
          </Document>
        </div>
      </div>

      <div
        className="flex-shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        {completeButton ?? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={isFirstPage}
              aria-label="Halaman sebelumnya"
              className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-700 text-base font-black text-neutral-200 transition-colors hover:bg-neutral-600 active:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </button>
            <button
              onClick={() => goTo(page + 1)}
              disabled={isLastPage}
              aria-label="Halaman berikutnya"
              className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 text-base font-black text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Selanjutnya
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfLoadingSpinner() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      <p className="text-sm font-semibold text-neutral-400">Memuat halaman...</p>
    </div>
  );
}

function PdfErrorMessage() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-600">Gagal memuat PDF.</p>
      <p className="text-sm text-red-500">Silakan coba lagi nanti.</p>
    </div>
  );
}

function PageSkeleton({ width }: { width: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-neutral-200"
      style={{ width, height: Math.round(width * 1.414) }}
    />
  );
}
