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
const PAGE_TRANSITION_DURATION = 300;

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
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [pageTransition, setPageTransition] = useState<PageTransition | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "active">("idle");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { containerRef, containerWidth } = usePdfSize<HTMLDivElement>();

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
    if (!pageTransition) return;

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
  }, [finishPageTransition, pageTransition, prefersReducedMotion]);

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
    const availableWidth = containerWidth > 0 ? containerWidth - (isDesktop ? 32 : 8) : isDesktop ? 800 : 352;
    return Math.min(1100, Math.max(1, availableWidth));
  }, [containerWidth, isDesktop]);

  const renderScale = useMemo(() => Math.max(1, Math.min(2, devicePixelRatio || 1)), [devicePixelRatio]);
  const renderWidth = useMemo(() => Math.max(1, Math.floor(pageWidth / renderScale)), [pageWidth, renderScale]);

  const renderPage = useCallback(
    (pageNumber: number) => (
      <div
        key={pageNumber}
        className={pageTransition ? "w-1/2 min-w-0 shrink-0" : "w-full min-w-0"}
      >
        <PdfPage
          key={`${pageNumber}-${Math.round(pageWidth)}-${renderScale}`}
          pageNumber={pageNumber}
          width={renderWidth}
          scale={renderScale}
          loading={<PdfLoading variant="skeleton" />}
        />
      </div>
    ),
    [pageTransition, pageWidth, renderScale, renderWidth]
  );

  const preloadPage = page < numPages ? page + 1 : page > 1 ? page - 1 : null;
  const backgroundPage = pageTransition?.to ?? page;

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
        <header className="comic-reader__header z-20 flex h-12 shrink-0 items-center justify-center border-b border-white/10 bg-[#0b1220]/95 px-2 backdrop-blur-md sm:px-6">
          <h1 className="max-w-full truncate text-xs font-semibold tracking-wide text-white/85 sm:text-sm">{comicTitle}</h1>
        </header>
      )}
      <div
        ref={containerRef}
        className="pdf-viewer-container relative flex min-h-0 flex-1 items-start justify-center overflow-hidden px-1 py-1 sm:px-4 sm:py-2"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleReaderTap}
      >
        <div className="pdf-viewer-container__content flex w-full items-start justify-center">
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
                style={{
                  transform: pageTransition ? "scale(1.07)" : "scale(1.05)",
                  transition: prefersReducedMotion
                    ? "none"
                    : "opacity 220ms ease, transform 220ms ease",
                }}
              >
                <PdfPage
                  pageNumber={backgroundPage}
                  width={renderWidth}
                  scale={renderScale}
                  loading={null}
                />
              </div>
            )}
            <div className="pdf-page-shell relative z-10 w-full overflow-hidden rounded-md bg-white sm:rounded-xl">
              <div className="flex justify-center overflow-hidden">
                <div className="w-full min-w-0 overflow-hidden">
                  {numPages > 0 ? (
                    <div className="mx-auto w-full overflow-hidden" style={{ maxWidth: `${pageWidth}px` }}>
                      <div
                        className={pageTransition ? "flex w-[200%]" : "relative w-full"}
                        style={{
                          transform: pageTransition
                            ? transitionPhase === "active"
                              ? pageTransition.direction === "next"
                                ? "translateX(-50%)"
                                : "translateX(0)"
                              : pageTransition.direction === "next"
                                ? "translateX(0)"
                                : "translateX(-50%)"
                            : "translateX(0)",
                          transition: prefersReducedMotion
                            ? "none"
                            : `transform ${PAGE_TRANSITION_DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
                          willChange: pageTransition ? "transform" : "auto",
                          contain: "layout paint",
                        }}
                        onTransitionEnd={(event) => {
                          if (event.target === event.currentTarget && event.propertyName === "transform") {
                            finishPageTransition();
                          }
                        }}
                      >
                        {pageTransition
                          ? pageTransition.direction === "next"
                            ? <>{renderPage(pageTransition.from)}{renderPage(pageTransition.to)}</>
                            : <>{renderPage(pageTransition.to)}{renderPage(pageTransition.from)}</>
                          : renderPage(page)}
                        {!pageTransition && preloadPage && (
                          <div className="pointer-events-none absolute left-0 top-0 w-full opacity-0" aria-hidden="true">
                            <PdfPage
                              pageNumber={preloadPage}
                              width={renderWidth}
                              scale={renderScale}
                              loading={null}
                            />
                          </div>
                        )}
                      </div>
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
