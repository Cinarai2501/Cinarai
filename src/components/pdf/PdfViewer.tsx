"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Document, pdfjs } from "react-pdf";
import { usePdfSize } from "@/hooks/usePdfSize";
import { getResponsivePageSize } from "./pdfViewerLayout";
import { markNextDocumentLoadAsInitial, shouldNotifyPageChange } from "./pdfViewerProgress";
import PdfError from "./PdfError";
import PdfLoading from "./PdfLoading";
import PdfNavigation from "./PdfNavigation";
import PdfPage from "./PdfPage";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;
const PAGE_TRANSITION_DURATION = 240;

type PdfDimensions = { width: number; height: number };
type PageTransition = {
  targetPage: number;
  direction: "next" | "previous";
};
type LoadedPdf = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => PdfDimensions;
  }>;
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
  const pathname = usePathname();
  const debug = pathname === "/debug-pdf";
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [workerReady, setWorkerReady] = useState(false);
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageTransition, setPageTransition] = useState<PageTransition | null>(null);
  const [targetPageReady, setTargetPageReady] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "active" | "committing">("idle");
  const [targetPageError, setTargetPageError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<PdfDimensions | null>(null);
  const { containerRef, containerWidth, containerHeight } = usePdfSize<HTMLDivElement>();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    if (shouldNotifyPageChange({ numPages, initialLoadRef })) onPageChange?.(page, numPages);
  }, [numPages, onPageChange, page]);

  useEffect(() => {
    setPage((current) => current === Math.max(1, initialPage ?? 1) ? current : Math.max(1, initialPage ?? 1));
    setDocumentLoaded(false);
    setPdfDimensions(null);
    setPageReady(false);
    setPdfError(null);
    setPageTransition(null);
    setTargetPageReady(false);
    setTransitionPhase("idle");
    setTargetPageError(null);
    markNextDocumentLoadAsInitial(initialLoadRef);
  }, [initialPage, pdfPath]);

  const goTo = useCallback((next: number) => {
    if (pageTransition) return;
    const targetPage = Math.min(Math.max(1, next), numPages || 1);
    if (targetPage === page) return;
    setPageTransition({
      targetPage,
      direction: targetPage > page ? "next" : "previous",
    });
    setTargetPageReady(false);
    setTransitionPhase("idle");
    setTargetPageError(null);
  }, [numPages, page, pageTransition]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      touchStartX.current = event.touches[0].clientX;
      touchStartY.current = event.touches[0].clientY;
    } else {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length > 1) {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dy) <= SWIPE_VERTICAL_LIMIT && Math.abs(dx) >= SWIPE_THRESHOLD) goTo(page + (dx < 0 ? 1 : -1));
  }, [goTo, page]);

  const handleDocumentLoadSuccess = useCallback(async (document: LoadedPdf) => {
    setNumPages(document.numPages);
    const requestedPage = initialPage ?? 1;
    setPage(requestedPage >= 1 && requestedPage <= document.numPages ? requestedPage : 1);
    setPageReady(false);
    setPdfError(null);

    try {
      const firstPage = await document.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      if (!Number.isFinite(viewport.width) || viewport.width <= 0 || !Number.isFinite(viewport.height) || viewport.height <= 0) {
        throw new Error("Ukuran halaman PDF tidak valid.");
      }
      setPdfDimensions(viewport);
      setDocumentLoaded(true);
    } catch (error) {
      setDocumentLoaded(false);
      setPdfError(error instanceof Error ? error.message : "Ukuran halaman PDF tidak dapat dibaca.");
    }
  }, [initialPage]);

  const handlePdfError = useCallback((error: Error) => {
    setDocumentLoaded(false);
    setPageReady(false);
    setPdfError(error.message || "PDF tidak dapat dimuat.");
  }, []);

  const handlePageLoadSuccess = useCallback((loadedPage: PdfDimensions) => {
    if (loadedPage.width > 0 && loadedPage.height > 0 && !pdfDimensions) setPdfDimensions(loadedPage);
  }, [pdfDimensions]);

  const handlePageRenderSuccess = useCallback(() => {
    setPageReady(true);
    if (pageTransition && transitionPhase === "committing") {
      setPageTransition(null);
      setTargetPageReady(false);
      setTransitionPhase("idle");
      setTargetPageError(null);
    }
  }, [pageTransition, transitionPhase]);

  const handlePageError = useCallback((error: Error) => {
    setPageReady(false);
    setPdfError(error.message || "Halaman PDF tidak dapat dirender.");
  }, []);

  const handleTargetPageRenderSuccess = useCallback(() => {
    setTargetPageReady(true);
    setTargetPageError(null);
  }, []);

  const handleTargetPageError = useCallback((error: Error) => {
    setTargetPageReady(false);
    setTargetPageError(error.message || "Halaman tujuan tidak dapat dirender.");
    setPageTransition(null);
    setTransitionPhase("idle");
  }, []);

  useEffect(() => {
    if (!pageTransition || !targetPageReady) return;

    const frame = window.requestAnimationFrame(() => {
      setTransitionPhase("active");
    });
    const timer = window.setTimeout(() => {
      setPage(pageTransition.targetPage);
      setPageReady(false);
      setTransitionPhase("committing");
    }, PAGE_TRANSITION_DURATION);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pageTransition, targetPageReady]);

  const showControlsTemporarily = useCallback(() => {
    setShowFloatingControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowFloatingControls(false), 2600);
  }, []);

  const handleReaderTap = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x >= rect.width * 0.2 && x <= rect.width * 0.8 && y >= rect.height * 0.2 && y <= rect.height * 0.8) showControlsTemporarily();
  }, [showControlsTemporarily]);

  useEffect(() => () => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
  }, []);

  const pageSize = useMemo(() => {
    if (!pdfDimensions) {
      return { width: 0, height: 0 };
    }

    const viewportWidth = containerWidth > 0 ? containerWidth : window.innerWidth * 0.92;
    const viewportHeight = containerHeight > 0 ? containerHeight : window.innerHeight * 0.72;
    const availableWidth = Math.max(220, Math.min(viewportWidth, window.innerWidth * 0.96));
    const availableHeight = Math.max(240, Math.min(viewportHeight, window.innerHeight * 0.82));

    return getResponsivePageSize({
      pdfWidth: pdfDimensions.width,
      pdfHeight: pdfDimensions.height,
      availableWidth,
      availableHeight,
    });
  }, [containerHeight, containerWidth, pdfDimensions]);

  const hasPageSize = Number.isFinite(pageSize.width) && pageSize.width > 0 && Number.isFinite(pageSize.height) && pageSize.height > 0;
  const isLoading = !documentLoaded || !pageReady;
  const containerError = documentLoaded && (containerWidth <= 0 || containerHeight <= 0)
    ? "Container PDF tidak memiliki ukuran yang valid."
    : null;
  const visiblePageError = pdfError ?? containerError;
  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) return <div className="flex h-full flex-col items-center justify-center bg-[#0b1220]"><PdfLoading /></div>;

  return (
    <div className="comic-reader relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#0b1220]">
      {comicTitle && <header className="comic-reader__header z-20 flex h-12 shrink-0 items-center border-b border-white/10 bg-[#0b1220]/95 px-2 backdrop-blur-md sm:px-6">
        <Link href="/dashboard" aria-label="Home" title="Home" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" /></svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-xs font-semibold tracking-wide text-white/85 sm:text-sm">{comicTitle}</h1>
        <div className="h-11 w-11 shrink-0" aria-hidden="true" />
      </header>}
      <div className="pdf-viewer-container relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[#0b1220]" style={{ touchAction: "pan-y", overscrollBehavior: "contain" }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={handleReaderTap}>
        <div ref={containerRef} className="pdf-viewer-container__content relative flex h-full min-h-0 w-full max-w-[1100px] flex-1 items-center justify-center px-1 sm:px-2 lg:px-4">
          <Document key={pdfPath} file={pdfPath} className="flex h-full w-full items-center justify-center bg-[#0b1220]" onLoadSuccess={handleDocumentLoadSuccess} onLoadError={handlePdfError} loading={<PdfLoading />} error={<PdfError message={pdfError ?? undefined} />}>
            {debug && (
              <div className="pdf-diagnostic absolute left-2 top-2 z-20 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-white" data-testid="pdf-diagnostic">
                PDF DEBUG | Container: {containerWidth} x {containerHeight} | PDF: {pdfDimensions ? `${pdfDimensions.width} x ${pdfDimensions.height}` : "—"} | Render: {pageSize.width} x {pageSize.height} | numPages: {numPages} | currentPage: {page} | targetPage: {pageTransition?.targetPage ?? "none"} | transition: {pageTransition ? transitionPhase : "idle"} | documentLoaded: {documentLoaded ? "READY" : "LOADING"} | pageReady: {pageReady ? "READY" : "LOADING"} | targetPageReady: {targetPageReady ? "READY" : "LOADING"} | pageError: {visiblePageError ?? targetPageError ?? "none"} | isLoading: {isLoading ? "true" : "false"}
              </div>
            )}
            <div className="pdf-page-shell relative z-10 flex items-center justify-center overflow-hidden rounded-md bg-white shadow-sm sm:rounded-xl" style={hasPageSize ? { width: `${pageSize.width}px`, height: `${pageSize.height}px`, maxWidth: "100%" } : undefined}>
              {visiblePageError ? <PdfError message={visiblePageError} /> : documentLoaded && numPages > 0 && hasPageSize ? (
                <>
                  <div className="absolute inset-0 z-10">
                    <PdfPage pageNumber={page} width={pageSize.width} loading={<PdfLoading variant="spinner" />} onLoadSuccess={handlePageLoadSuccess} onLoadError={handlePageError} onRenderSuccess={handlePageRenderSuccess} />
                  </div>
                  {pageTransition && (
                    <div
                      className="absolute inset-0 z-20 overflow-hidden"
                      data-testid="pdf-target-layer"
                      style={{
                        opacity: targetPageReady && (transitionPhase === "active" || transitionPhase === "committing") ? 1 : 0,
                        transform: targetPageReady && (transitionPhase === "active" || transitionPhase === "committing")
                          ? "translateX(0)"
                          : pageTransition.direction === "next" ? "translateX(100%)" : "translateX(-100%)",
                        transition: `opacity ${PAGE_TRANSITION_DURATION}ms ease-out, transform ${PAGE_TRANSITION_DURATION}ms ease-out`,
                        willChange: "opacity, transform",
                      }}
                    >
                      <PdfPage
                        pageNumber={pageTransition.targetPage}
                        width={pageSize.width}
                        loading={null}
                        error={null}
                        onLoadError={handleTargetPageError}
                        onRenderSuccess={handleTargetPageRenderSuccess}
                      />
                    </div>
                  )}
                </>
              ) : <PdfLoading variant="spinner" />}
            </div>
          </Document>
        </div>
        <div className="pdf-viewer-container__navigation pointer-events-none absolute inset-0 z-30">
          <PdfNavigation floating visible={showFloatingControls} onPrev={() => goTo(page - 1)} onNext={() => goTo(page + 1)} currentPage={page} numPages={numPages} isFirstPage={isFirstPage} isLastPage={isLastPage} showCompleteButton={showCompleteButton} completeButtonLabel={completeButtonLabel} completeButtonDisabled={completeButtonDisabled} onComplete={onComplete} isComicCompleted={isComicCompleted} completeButtonLabelWhenDone={completeButtonLabelWhenDone} />
        </div>
      </div>
    </div>
  );
}
