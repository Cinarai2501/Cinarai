"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { usePdfSize } from "@/hooks/usePdfSize";
import PdfError from "./PdfError";
import PdfLoading from "./PdfLoading";
import PdfNavigation from "./PdfNavigation";
import PdfPage from "./PdfPage";
import PdfToolbar from "./PdfToolbar";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;
const DESKTOP_MAX_PAGE_WIDTH = 900;

interface PdfViewerProps {
  pdfPath: string;
  comicId?: number;
  comicTitle?: string;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
  isComicCompleted?: boolean;
  completeButtonLabelWhenDone?: string;
  initialPage?: number;
}

export default function PdfViewer({
  pdfPath,
  comicTitle,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onPageChange,
  isComicCompleted = false,
  completeButtonLabelWhenDone = "Lanjut ke Identification",
  initialPage = 1,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [workerReady, setWorkerReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  const { containerRef, containerWidth } = usePdfSize<HTMLDivElement>();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    if (numPages > 0) onPageChange?.(page, numPages);
  }, [numPages, onPageChange, page]);

  useEffect(() => {
    const updateViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

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
      setPage(initialPage ?? 1);
    },
    [initialPage]
  );

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const pageWidth = useMemo(() => {
    const base = containerWidth > 0 ? containerWidth : (isDesktop ? 800 : 360);
    return isDesktop ? Math.min(base, DESKTOP_MAX_PAGE_WIDTH) : base;
  }, [containerWidth, isDesktop]);

  const renderScale = useMemo(() => Math.max(1, Math.min(2, devicePixelRatio || 1)), [devicePixelRatio]);
  const renderWidth = useMemo(() => Math.max(1, Math.floor(pageWidth / renderScale)), [pageWidth, renderScale]);

  const pageKey = useMemo(() => `${page}-${Math.round(pageWidth)}-${renderScale}`, [page, pageWidth, renderScale]);

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
                  {numPages > 0 ? (
                    <div className="mx-auto w-full" style={{ maxWidth: `${pageWidth}px` }}>
                      <PdfPage
                        key={pageKey}
                        pageNumber={page}
                        width={renderWidth}
                        scale={renderScale}
                        loading={<PdfLoading variant="skeleton" />}
                      />
                    </div>
                  ) : (
                    <PdfLoading variant="skeleton" />
                  )}
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
        isComicCompleted={isComicCompleted}
        completeButtonLabelWhenDone={completeButtonLabelWhenDone}
      />
    </div>
  );
}
