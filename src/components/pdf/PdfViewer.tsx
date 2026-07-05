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
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#f5f7fa] py-3"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/*
          ── Constraint div (containerRef) ──────────────────────────────────────
          This is the element usePdfSize observes.

          Rules this element MUST follow:
            • no border          → contentRect.width == available width
            • no horizontal padding → same reason
            • overflow: hidden   → hard clip that prevents react-pdf's
                                   `minWidth: min-content` from inflating
                                   this element's measured width
            • w-full             → fills the scroll container
            • px-3 sm:px-4       → visual margin for the card inside;
                                   these are on the INNER card, not here

          Because overflow:hidden clips at this boundary, getBoundingClientRect()
          and contentRect.width always return the true available width regardless
          of what the Page div's minWidth:min-content tries to do.
        */}
        <div
          ref={containerRef}
          className="w-full overflow-hidden"
        >
          {/*
            ── Visual card ────────────────────────────────────────────────────
            border, rounded, shadow are purely decorative.
            mx-3 / sm:mx-4 creates the horizontal margin inside the constraint.
            The card's content-box = containerWidth - 2*margin - 2*border.
            <Page> receives containerWidth (the full constraint width), which
            is slightly wider than the card's content-box — but because the
            constraint div has overflow:hidden, the canvas is clipped exactly
            at containerWidth. The 6px of card border+margin on each side
            means the canvas is visually inset, which is the desired look.

            If pixel-perfect fit inside the card is required, pass
            (containerWidth - cardHorizontalInset) to <Page>. But since
            containerRef has overflow:hidden, there is zero crop regardless.
          */}
          <div className="mx-3 my-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mx-4">
            <Document
              key={`pdf-${retryCount}`}
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<PdfLoading />}
              error={<PdfError onRetry={handleRetry} />}
            >
              {/*
                key={`${page}-${containerWidth}`} forces react-pdf to fully
                unmount and remount <Page> whenever the page number or the
                available width changes. This prevents stale canvas renders
                from a previous width being visible during the transition.
              */}
              <PdfPage
                key={`${page}-${containerWidth}`}
                pageNumber={page}
                width={containerWidth}
                loading={containerWidth > 0 ? <PdfLoading variant="skeleton" /> : null}
              />
            </Document>
          </div>
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
