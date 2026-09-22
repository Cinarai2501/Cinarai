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
import { clampZoom, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, stepZoom } from "./pdfViewerZoom";
import { hasSeenZoomHint, markZoomHintSeen } from "./pdfViewerZoomHint";

const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 80;

type PdfDimensions = { width: number; height: number };
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
  const [pdfDimensions, setPdfDimensions] = useState<PdfDimensions | null>(null);
  const [scale, setScale] = useState(DEFAULT_ZOOM);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const { containerRef, containerWidth, containerHeight } = usePdfSize<HTMLDivElement>();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(DEFAULT_ZOOM);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    setWorkerReady(true);
  }, []);

  useEffect(() => {
    if (!hasSeenZoomHint()) setShowZoomHint(true);
  }, []);

  useEffect(() => {
    if (!showZoomHint) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        markZoomHintSeen();
        setShowZoomHint(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showZoomHint]);

  useEffect(() => {
    if (shouldNotifyPageChange({ numPages, initialLoadRef })) onPageChange?.(page, numPages);
  }, [numPages, onPageChange, page]);

  useEffect(() => {
    setPage((current) => current === Math.max(1, initialPage ?? 1) ? current : Math.max(1, initialPage ?? 1));
    setDocumentLoaded(false);
    setPdfDimensions(null);
    setPageReady(false);
    setPdfError(null);
    markNextDocumentLoadAsInitial(initialLoadRef);
  }, [initialPage, pdfPath]);

  const goTo = useCallback((next: number) => {
    const targetPage = Math.min(Math.max(1, next), numPages || 1);
    if (targetPage === page) return;
    setPageReady(false);
    setPage(targetPage);
  }, [numPages, page]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const [firstTouch, secondTouch] = Array.from(event.touches);
      pinchStartDistance.current = Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
      pinchStartScale.current = scale;
      touchStartX.current = null;
      touchStartY.current = null;
    } else if (event.touches.length === 1 && pinchStartDistance.current === null) {
      touchStartX.current = event.touches[0].clientX;
      touchStartY.current = event.touches[0].clientY;
    } else {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, [scale]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length >= 2 && pinchStartDistance.current !== null) {
      const [firstTouch, secondTouch] = Array.from(event.touches);
      const distance = Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
      setScale(clampZoom(pinchStartScale.current * (distance / pinchStartDistance.current)));
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (event.touches.length < 2) pinchStartDistance.current = null;
    if (scale > DEFAULT_ZOOM) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    if (touchStartX.current === null || touchStartY.current === null || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dy) <= SWIPE_VERTICAL_LIMIT && Math.abs(dx) >= SWIPE_THRESHOLD) goTo(page + (dx < 0 ? 1 : -1));
  }, [goTo, page, scale]);

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
  }, []);

  const handlePageError = useCallback((error: Error) => {
    setPageReady(false);
    setPdfError(error.message || "Halaman PDF tidak dapat dirender.");
  }, []);

  const zoomIn = useCallback(() => setScale((currentScale) => stepZoom(currentScale, 1)), []);
  const zoomOut = useCallback(() => setScale((currentScale) => stepZoom(currentScale, -1)), []);
  const resetZoom = useCallback(() => setScale(DEFAULT_ZOOM), []);
  const dismissZoomHint = useCallback(() => {
    markZoomHintSeen();
    setShowZoomHint(false);
  }, []);

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

    const viewportWidth = Math.max(1, typeof window !== "undefined" ? window.innerWidth : containerWidth || 0);
    const horizontalPadding = 12;
    const isMobilePortrait = viewportWidth <= 480;
    const availableWidth = isMobilePortrait
      ? Math.max(260, viewportWidth - horizontalPadding)
      : Math.max(260, (containerWidth > 0 ? containerWidth : viewportWidth) - horizontalPadding);

    return getResponsivePageSize({
      pdfWidth: pdfDimensions.width,
      pdfHeight: pdfDimensions.height,
      availableWidth,
      availableHeight: isMobilePortrait
        ? Number.POSITIVE_INFINITY
        : Math.max(240, containerHeight > 0 ? containerHeight - 16 : window.innerHeight - 16),
    });
  }, [containerHeight, containerWidth, pdfDimensions]);

  const devicePixelRatio = useMemo(() => {
    const nativePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.min(nativePixelRatio, containerWidth > 700 ? 1.75 : 1.35);
  }, [containerWidth]);

  const hasPageSize = Number.isFinite(pageSize.width) && pageSize.width > 0 && Number.isFinite(pageSize.height) && pageSize.height > 0;
  const renderScale = pdfDimensions && hasPageSize ? (pageSize.width / pdfDimensions.width) * scale : 0;
  const renderedPageSize = hasPageSize
    ? { width: Math.round(pageSize.width * scale), height: Math.round(pageSize.height * scale) }
    : { width: 0, height: 0 };
  const isLoading = !documentLoaded || !pageReady;
  const containerError = documentLoaded && (containerWidth <= 0 || containerHeight <= 0)
    ? "Container PDF tidak memiliki ukuran yang valid."
    : null;
  const visiblePageError = pdfError ?? containerError;
  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) return <div className="flex h-full flex-col items-center justify-center bg-[#0b1220]"><PdfLoading /></div>;

  return (
    <div className="comic-reader relative flex min-h-[100dvh] w-full min-w-0 flex-col bg-[#0b1220]">
      {comicTitle && <header className="comic-reader__header z-20 flex h-12 shrink-0 items-center border-b border-white/10 bg-[#0b1220]/95 px-2 backdrop-blur-md sm:px-6">
        <Link href="/dashboard" aria-label="Home" title="Home" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" /></svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-xs font-semibold tracking-wide text-white/85 sm:text-sm">{comicTitle}</h1>
        <div className="h-11 w-11 shrink-0" aria-hidden="true" />
      </header>}
      <div className="pdf-viewer-container relative flex min-h-[calc(100dvh-3rem)] min-w-0 flex-1 flex-col bg-[#0b1220]" style={{ touchAction: "pan-x pan-y", overscrollBehavior: "contain" }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={handleReaderTap}>
        <div className="sticky top-0 z-40 flex min-h-[52px] shrink-0 items-center justify-center border-b border-white/10 bg-[#0b1220]/95 px-2 py-1.5 backdrop-blur-md" aria-label="Kontrol pembaca PDF">
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
            <button type="button" onClick={zoomOut} disabled={scale <= MIN_ZOOM} aria-label="Perkecil PDF" className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35">−</button>
            <button type="button" onClick={resetZoom} aria-label={`Atur ulang zoom ke 100%, saat ini ${Math.round(scale * 100)}%`} className="min-w-[68px] rounded-lg px-2 py-2 text-sm font-bold tabular-nums text-white hover:bg-white/10">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={zoomIn} disabled={scale >= MAX_ZOOM} aria-label="Perbesar PDF" className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35">+</button>
            <div className="mx-1 h-7 w-px bg-white/15" aria-hidden="true" />
            <span className="min-w-[58px] text-center text-sm font-semibold tabular-nums text-white/80" aria-label={`Halaman ${page} dari ${numPages || 0}`}>{page} / {numPages || "-"}</span>
          </div>
        </div>
        {showZoomHint && <div className="pointer-events-none absolute inset-x-0 top-[60px] z-50 flex justify-center px-3 sm:top-[64px]" role="dialog" aria-labelledby="pdf-zoom-hint-title">
          <div className="pointer-events-auto w-full max-w-[360px] rounded-2xl border border-primary-100 bg-white p-4 text-center shadow-[0_16px_40px_rgba(15,23,42,0.24)] animate-fade-in-up sm:p-5">
            <h2 id="pdf-zoom-hint-title" className="text-lg font-black text-neutral-800">👆 Tips membaca komik</h2>
            <div className="mt-3 space-y-2.5 text-sm leading-5 text-neutral-700">
              <p>🤏 Cubit keluar untuk memperbesar</p>
              <p>🤌 Cubit masuk untuk memperkecil</p>
              <p>👆 Geser untuk melihat bagian komik</p>
            </div>
            <button type="button" onClick={dismissZoomHint} className="mt-4 min-h-[44px] w-full rounded-xl bg-primary-600 px-4 py-2.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800">Mengerti</button>
          </div>
        </div>}
        <div ref={containerRef} className="pdf-viewer-container__content relative flex min-h-[calc(100dvh-6.25rem)] w-full flex-1 items-start justify-start overflow-auto px-0.5 py-4 [-webkit-overflow-scrolling:touch] sm:px-1 sm:py-6 lg:px-2">
          <Document key={pdfPath} file={pdfPath} className="flex min-h-full min-w-full items-start justify-start bg-[#0b1220]" onLoadSuccess={handleDocumentLoadSuccess} onLoadError={handlePdfError} loading={<PdfLoading />} error={<PdfError message={pdfError ?? undefined} />}>
            {debug && (
              <div className="pdf-diagnostic absolute left-2 top-2 z-20 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-white" data-testid="pdf-diagnostic">
                PDF DEBUG | Container: {containerWidth} x {containerHeight} | PDF: {pdfDimensions ? `${pdfDimensions.width} x ${pdfDimensions.height}` : "—"} | Render: {pageSize.width} x {pageSize.height} | numPages: {numPages} | currentPage: {page} | documentLoaded: {documentLoaded ? "READY" : "LOADING"} | pageReady: {pageReady ? "READY" : "LOADING"} | pageError: {visiblePageError ?? "none"} | isLoading: {isLoading ? "true" : "false"}
              </div>
            )}
            <div className="pdf-page-shell relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm transition-opacity duration-150 sm:rounded-xl" style={hasPageSize ? { width: `${renderedPageSize.width}px`, height: `${renderedPageSize.height}px`, marginInline: "auto", opacity: pageReady ? 1 : 0.82 } : undefined}>
              {visiblePageError ? <PdfError message={visiblePageError} /> : documentLoaded && numPages > 0 && hasPageSize ? (
                <PdfPage pageNumber={page} scale={renderScale} devicePixelRatio={devicePixelRatio} loading={<PdfLoading variant="spinner" />} onLoadSuccess={handlePageLoadSuccess} onLoadError={handlePageError} onRenderSuccess={handlePageRenderSuccess} />
              ) : <PdfLoading variant="spinner" />}
            </div>
          </Document>
        </div>
        <div className="pdf-viewer-container__navigation pointer-events-none absolute inset-x-0 bottom-0 z-30 w-full px-2 pb-[env(safe-area-inset-bottom)] sm:px-4">
          <PdfNavigation floating inFlow visible={showFloatingControls} onPrev={() => goTo(page - 1)} onNext={() => goTo(page + 1)} currentPage={page} numPages={numPages} isFirstPage={isFirstPage} isLastPage={isLastPage} showCompleteButton={showCompleteButton} completeButtonLabel={completeButtonLabel} completeButtonDisabled={completeButtonDisabled} onComplete={onComplete} isComicCompleted={isComicCompleted} completeButtonLabelWhenDone={completeButtonLabelWhenDone} />
        </div>
      </div>
    </div>
  );
}
