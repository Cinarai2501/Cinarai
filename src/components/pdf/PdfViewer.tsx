"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { usePdfSize } from "@/hooks/usePdfSize";
import { markNextDocumentLoadAsInitial, shouldNotifyPageChange } from "./pdfViewerProgress";
import PdfError from "./PdfError";
import PdfLoading from "./PdfLoading";
import PdfNavigation from "./PdfNavigation";
import PdfPage from "./PdfPage";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;

interface UnifiedComicViewerProps {
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

export default function UnifiedComicViewer({
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
}: UnifiedComicViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [workerReady, setWorkerReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [showFloatingControls, setShowFloatingControls] = useState(false);

  const { containerRef, containerWidth } = usePdfSize<HTMLDivElement>();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    if (shouldNotifyPageChange({ numPages, initialLoadRef })) {
      onPageChange?.(page, numPages);
    }
  }, [numPages, onPageChange, page]);

  useEffect(() => {
    setPage((current) => {
      const nextPage = Math.max(1, initialPage ?? 1);
      return current === nextPage ? current : nextPage;
    });
    // When the PDF source or initialPage changes (new document), treat
    // the next numPages update as the initial load and avoid
    // reporting it as user activity.
    markNextDocumentLoadAsInitial(initialLoadRef);
  }, [initialPage, pdfPath]);

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
      const requestedPage = initialPage ?? 1;
      const resolvedPage = requestedPage < 1 || requestedPage > n ? 1 : requestedPage;
      setPage(resolvedPage);
    },
    [initialPage]
  );

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowFloatingControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setShowFloatingControls(false);
    }, 2600);
  }, []);

  const handleReaderTap = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centered =
        x >= rect.width * 0.2 &&
        x <= rect.width * 0.8 &&
        y >= rect.height * 0.2 &&
        y <= rect.height * 0.8;

      if (centered) {
        showControlsTemporarily();
      }
    },
    [showControlsTemporarily]
  );

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  const pageWidth = useMemo(() => {
    const base = containerWidth > 0 ? containerWidth : (isDesktop ? 800 : 360);
    return base;
  }, [containerWidth, isDesktop]);

  const renderScale = useMemo(() => Math.max(1, Math.min(2, devicePixelRatio || 1)), [devicePixelRatio]);
  const renderWidth = useMemo(() => Math.max(1, Math.floor(pageWidth / renderScale)), [pageWidth, renderScale]);

  const pageKey = useMemo(() => `${page}-${Math.round(pageWidth)}-${renderScale}`, [page, pageWidth, renderScale]);

  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#f5f7fa]">
        <PdfLoading />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-w-0 flex-col bg-white">
      <div
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-white px-0 py-0"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleReaderTap}
      >
        <div className="flex min-h-full w-full flex-col items-center justify-start">
          <Document
            key={`pdf-${retryCount}`}
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<PdfLoading />}
            error={<PdfError onRetry={handleRetry} />}
          >
            <div className="w-full overflow-hidden bg-white">
              <div className="flex justify-center overflow-hidden">
                <div className="w-full min-w-0 overflow-hidden">
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

      {showFloatingControls && comicTitle && (
        <div className="pointer-events-none absolute left-0 right-0 top-4 z-30 flex justify-center px-4">
          <div className="pointer-events-auto max-w-[min(92vw,640px)] truncate rounded-full border border-white/50 bg-black/55 px-5 py-2 text-center text-xs font-black text-white shadow-lg backdrop-blur-md sm:text-sm">
            {comicTitle}
          </div>
        </div>
      )}

      <PdfNavigation
        floating
        visible={showFloatingControls}
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
