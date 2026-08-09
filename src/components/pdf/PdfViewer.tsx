"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Document, pdfjs } from "react-pdf";
import { usePdfSize } from "@/hooks/usePdfSize";
import { markNextDocumentLoadAsInitial, shouldNotifyPageChange } from "./pdfViewerProgress";
import PdfError from "./PdfError";
import PdfLoading from "./PdfLoading";
import PdfNavigation from "./PdfNavigation";
import PdfPage from "./PdfPage";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;
const PAGE_TRANSITION_DURATION = 220;
const DEFAULT_PDF_ASPECT_RATIO = 8.5 / 11;

type PageTransition = {
  from: number;
  to: number;
  direction: "next" | "previous";
};

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
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [pageTransition, setPageTransition] = useState<PageTransition | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "active">("idle");
  const [targetPageReady, setTargetPageReady] = useState(false);
  const [pdfAspectRatio, setPdfAspectRatio] = useState(DEFAULT_PDF_ASPECT_RATIO);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { containerRef, containerWidth, containerHeight } = usePdfSize<HTMLDivElement>();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionFrame = useRef<number | null>(null);
  const transitionRef = useRef<PageTransition | null>(null);
  const isTransitioningRef = useRef(false);
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
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const finishPageTransition = useCallback(() => {
    const activeTransition = transitionRef.current;
    if (!activeTransition) return;

    transitionRef.current = null;
    isTransitioningRef.current = false;
    setPage(activeTransition.to);
    setPageTransition(null);
    setTransitionPhase("idle");
  }, []);

  useEffect(() => {
    if (!pageTransition || !targetPageReady) return;

    transitionFrame.current = window.requestAnimationFrame(() => {
      setTransitionPhase("active");
    });

    transitionTimer.current = setTimeout(
      finishPageTransition,
      prefersReducedMotion ? 0 : PAGE_TRANSITION_DURATION + 50
    );

    return () => {
      if (transitionFrame.current !== null) {
        window.cancelAnimationFrame(transitionFrame.current);
      }
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, [finishPageTransition, pageTransition, prefersReducedMotion, targetPageReady]);

  const goTo = useCallback(
    (next: number) => {
      if (isTransitioningRef.current) return;

      const targetPage = Math.min(Math.max(1, next), numPages || 1);
      if (targetPage === page) return;

      const nextTransition: PageTransition = {
        from: page,
        to: targetPage,
        direction: targetPage > page ? "next" : "previous",
      };

      isTransitioningRef.current = true;
      transitionRef.current = nextTransition;
      setTargetPageReady(false);
      setTransitionPhase("idle");
      setPageTransition(nextTransition);
    },
    [numPages, page]
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

  const handlePageLoadSuccess = useCallback((loadedPage: { width: number; height: number }) => {
    if (loadedPage.width > 0 && loadedPage.height > 0) {
      setPdfAspectRatio(loadedPage.width / loadedPage.height);
    }
  }, []);

  const handleTargetPageRenderSuccess = useCallback(() => {
    setTargetPageReady(true);
  }, []);

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
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
      if (transitionFrame.current !== null) {
        window.cancelAnimationFrame(transitionFrame.current);
      }
    };
  }, []);

  const pageWidth = useMemo(() => {
    const availableWidth = containerWidth > 0 ? containerWidth : isDesktop ? 800 : 360;
    const availableHeight = containerHeight > 0 ? containerHeight : isDesktop ? 700 : 600;
    return Math.max(1, Math.min(availableWidth, availableHeight * pdfAspectRatio));
  }, [containerHeight, containerWidth, isDesktop, pdfAspectRatio]);

  const renderPage = useCallback(
    (pageNumber: number, isTarget = false) => (
      <div
        key={pageNumber}
        className="absolute inset-0 flex h-full w-full items-center justify-center"
      >
        <PdfPage
          key={`${pageNumber}-${Math.round(pageWidth)}`}
          pageNumber={pageNumber}
          width={Math.round(pageWidth)}
          loading={<PdfLoading variant="skeleton" />}
          onLoadSuccess={handlePageLoadSuccess}
          onRenderSuccess={isTarget ? handleTargetPageRenderSuccess : undefined}
        />
      </div>
    ),
    [handlePageLoadSuccess, handleTargetPageRenderSuccess, pageWidth]
  );

  const backgroundPage = page;

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
    <div className="comic-reader relative flex h-[100dvh] min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#0b1220]">
      {comicTitle && (
        <header className="comic-reader__header z-20 flex h-12 shrink-0 items-center border-b border-white/10 bg-[#0b1220]/95 px-2 backdrop-blur-md sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Home"
            title="Home"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" />
            </svg>
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-xs font-semibold tracking-wide text-white/85 sm:text-sm">{comicTitle}</h1>
          <div className="h-11 w-11 shrink-0" aria-hidden="true" />
        </header>
      )}
      <div
        ref={containerRef}
        className="pdf-viewer-container relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleReaderTap}
      >
        <div className="pdf-viewer-container__content flex h-full w-full items-start justify-center">
          <Document
            key={`pdf-${retryCount}`}
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<PdfLoading />}
            error={<PdfError onRetry={handleRetry} />}
          >
            {numPages > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#172033] [&>div]:h-full [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:max-w-none [&_canvas]:object-cover [&_canvas]:opacity-20 [&_canvas]:blur-[16px]"
              >
                <PdfPage
                  pageNumber={backgroundPage}
                  width={Math.round(pageWidth)}
                  loading={null}
                />
              </div>
            )}
            <div
              className="pdf-page-shell relative z-10 flex max-h-full w-full items-start justify-center overflow-hidden rounded-md bg-white sm:rounded-xl"
              style={{ width: `${pageWidth}px`, aspectRatio: `${pdfAspectRatio}` }}
            >
              {numPages > 0 ? (
                <div className="relative h-full w-full overflow-hidden">
                  {pageTransition ? (
                    <>
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          opacity: transitionPhase === "active" ? 0 : 1,
                          transform: transitionPhase === "active"
                            ? pageTransition.direction === "next" ? "translateX(-4%)" : "translateX(4%)"
                            : "translateX(0)",
                          transition: prefersReducedMotion
                            ? "none"
                            : `opacity ${PAGE_TRANSITION_DURATION}ms ease, transform ${PAGE_TRANSITION_DURATION}ms ease`,
                          willChange: "opacity, transform",
                        }}
                      >
                        {renderPage(pageTransition.from)}
                      </div>
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        aria-hidden={!targetPageReady}
                        style={{
                          opacity: targetPageReady && transitionPhase === "active" ? 1 : 0,
                          transform: targetPageReady && transitionPhase === "active"
                            ? "translateX(0)"
                            : pageTransition.direction === "next" ? "translateX(4%)" : "translateX(-4%)",
                          transition: prefersReducedMotion
                            ? "none"
                            : `opacity ${PAGE_TRANSITION_DURATION}ms ease, transform ${PAGE_TRANSITION_DURATION}ms ease`,
                          willChange: "opacity, transform",
                        }}
                      >
                        {renderPage(pageTransition.to, true)}
                      </div>
                    </>
                  ) : (
                    renderPage(page)
                  )}
                </div>
              ) : (
                <PdfLoading variant="skeleton" />
              )}
            </div>
          </Document>
        </div>
      </div>

      <div className="pdf-viewer-container__navigation pointer-events-none absolute inset-0 z-30">
        <PdfNavigation
          floating
          visible={showFloatingControls}
          onPrev={() => goTo(page - 1)}
          onNext={() => goTo(page + 1)}
          currentPage={page}
          numPages={numPages}
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
    </div>
  );
}
