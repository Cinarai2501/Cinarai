"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { usePdfSize } from "@/hooks/usePdfSize";
import PdfError from "./PdfError";
import PdfLoading from "./PdfLoading";
import PdfNavigation from "./PdfNavigation";
import PdfPage from "./PdfPage";
import PdfToolbar from "./PdfToolbar";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;

interface PdfViewerProps {
  pdfPath: string;
  comicTitle?: string;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
}

export default function PdfViewer({
  pdfPath,
  comicTitle,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onPageChange,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [workerReady, setWorkerReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * containerRef is attached to the outermost constraint div — the element
   * that sits OUTSIDE the card (no border, no horizontal padding).
   *
   * Why outside the card:
   *   react-pdf's <Page> renders a div with `minWidth: min-content`.
   *   If containerRef is inside the card, the Page div can inflate the card's
   *   width before ResizeObserver fires, causing the measurement to reflect
   *   the PDF's native width instead of the available viewport width.
   *
   *   By placing containerRef on an ancestor that has `overflow: hidden`,
   *   the browser clips the Page div at the constraint boundary. The
   *   getBoundingClientRect() / contentRect.width of this element is always
   *   the true available width, unaffected by the canvas inside.
   */
  const { containerRef, containerWidth } = usePdfSize<HTMLDivElement>();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    if (numPages > 0) onPageChange?.(page, numPages);
  }, [numPages, onPageChange, page]);

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), numPages || 1)),
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

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [goTo, page]
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPage(1);
    },
    []
  );

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;
  const progressPct = numPages > 0 ? Math.round((page / numPages) * 100) : 0;

  if (!workerReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#f5f7fa]">
        <PdfLoading />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f5f7fa]">
      <PdfToolbar
        comicTitle={comicTitle}
        currentPage={page}
        totalPages={numPages}
        progress={progressPct}
        isLoading={!workerReady}
      />

      {/*
        ── Scroll container ────────────────────────────────────────────────────
        overflow-y-auto  : vertical scroll for tall pages
        overflow-x-hidden: belt-and-suspenders horizontal clip
        py-3             : vertical breathing room only — no horizontal padding
                           so containerRef measures the full available width
      */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-[#f5f7fa] px-1 py-3 sm:px-2 md:px-3"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto flex w-full max-w-full flex-col items-center">
          <Document
            key={`pdf-${retryCount}`}
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<PdfLoading />}
            error={<PdfError onRetry={handleRetry} />}
          >
            <div className="my-3 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex justify-center overflow-hidden">
                <div className="w-full max-w-full min-w-0 overflow-hidden">
                  <PdfPage
                    key={`${page}-${containerWidth}`}
                    pageNumber={page}
                    width={containerWidth}
                    loading={containerWidth > 0 ? <PdfLoading variant="skeleton" /> : null}
                  />
                </div>
              </div>
            </div>
          </Document>
        </div>
      </div>

      <PdfNavigation
        onPrev={() => goTo(page - 1)}
        onNext={() => goTo(page + 1)}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        showCompleteButton={showCompleteButton}
        completeButtonLabel={completeButtonLabel}
        completeButtonDisabled={completeButtonDisabled}
        onComplete={onComplete}
      />
    </div>
  );
}
