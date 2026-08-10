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
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [workerReady, setWorkerReady] = useState(false);
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
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
    setBackgroundImage(null);
    markNextDocumentLoadAsInitial(initialLoadRef);
  }, [initialPage, pdfPath]);

  const goTo = useCallback((next: number) => {
    setPage((current) => {
      const targetPage = Math.min(Math.max(1, next), numPages || 1);
      if (targetPage === current) return current;
      setPageReady(false);
      setPdfError(null);
      return targetPage;
    });
  }, [numPages]);

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
    const canvas = document.querySelector<HTMLCanvasElement>(".pdf-page-shell canvas");
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      setBackgroundImage(canvas.toDataURL("image/jpeg", 0.72));
    }
    setPageReady(true);
  }, []);

  const handlePageError = useCallback((error: Error) => {
    setPageReady(false);
    setPdfError(error.message || "Halaman PDF tidak dapat dirender.");
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
    if (!pdfDimensions || containerWidth <= 0 || containerHeight <= 0) return { width: 0, height: 0 };
    const scale = Math.min(containerWidth / pdfDimensions.width, containerHeight / pdfDimensions.height);
    return { width: Math.floor(pdfDimensions.width * scale), height: Math.floor(pdfDimensions.height * scale) };
  }, [containerHeight, containerWidth, pdfDimensions]);

  const hasPageSize = Number.isFinite(pageSize.width) && pageSize.width > 0 && Number.isFinite(pageSize.height) && pageSize.height > 0;
  const isLoading = !documentLoaded || !pageReady;
  const containerError = documentLoaded && (containerWidth <= 0 || containerHeight <= 0)
    ? "Container PDF tidak memiliki ukuran yang valid."
    : null;
  const visiblePageError = pdfError ?? containerError;
  const isFirstPage = page <= 1;
  const isLastPage = numPages > 0 && page === numPages;

  if (!workerReady) return <div className="flex h-full flex-col items-center justify-center bg-[#f5f7fa]"><PdfLoading /></div>;

  return (
    <div className="comic-reader relative flex h-[100dvh] min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#0b1220]">
      {comicTitle && <header className="comic-reader__header z-20 flex h-12 shrink-0 items-center border-b border-white/10 bg-[#0b1220]/95 px-2 backdrop-blur-md sm:px-6">
        <Link href="/dashboard" aria-label="Home" title="Home" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" /></svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-xs font-semibold tracking-wide text-white/85 sm:text-sm">{comicTitle}</h1>
        <div className="h-11 w-11 shrink-0" aria-hidden="true" />
      </header>}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0b1220] bg-cover bg-center opacity-30 blur-[18px]"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      />
      <div className="pdf-viewer-container relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" style={{ touchAction: "pan-y", overscrollBehavior: "contain" }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={handleReaderTap}>
        <div ref={containerRef} className="pdf-viewer-container__content relative flex h-full w-full max-w-[1100px] items-start justify-center px-1 sm:px-2 lg:px-4">
          <Document file={pdfPath} onLoadSuccess={handleDocumentLoadSuccess} onLoadError={handlePdfError} loading={<PdfLoading />} error={<PdfError message={pdfError ?? undefined} />}>
            <div className="pdf-diagnostic absolute left-2 top-2 z-20 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-white" data-testid="pdf-diagnostic">
              PDF DEBUG | Container: {containerWidth} x {containerHeight} | PDF: {pdfDimensions ? `${pdfDimensions.width} x ${pdfDimensions.height}` : "—"} | Render: {pageSize.width} x {pageSize.height} | numPages: {numPages} | currentPage: {page} | documentLoaded: {documentLoaded ? "READY" : "LOADING"} | pageReady: {pageReady ? "READY" : "LOADING"} | pageError: {visiblePageError ?? "none"} | isLoading: {isLoading ? "true" : "false"}
            </div>
            <div className="pdf-page-shell relative z-10 flex max-h-full w-full items-start justify-center overflow-hidden rounded-md bg-white sm:rounded-xl" style={hasPageSize ? { width: `${pageSize.width}px`, height: `${pageSize.height}px` } : undefined}>
              {visiblePageError ? <PdfError message={visiblePageError} /> : documentLoaded && numPages > 0 && hasPageSize ? <PdfPage pageNumber={page} width={pageSize.width} loading={<PdfLoading variant="spinner" />} onLoadSuccess={handlePageLoadSuccess} onLoadError={handlePageError} onRenderSuccess={handlePageRenderSuccess} /> : <PdfLoading variant="spinner" />}
            </div>
          </Document>
        </div>
      </div>
      <div className="pdf-viewer-container__navigation pointer-events-none absolute inset-0 z-30">
        <PdfNavigation floating visible={showFloatingControls} onPrev={() => goTo(page - 1)} onNext={() => goTo(page + 1)} currentPage={page} numPages={numPages} isFirstPage={isFirstPage} isLastPage={isLastPage} showCompleteButton={showCompleteButton} completeButtonLabel={completeButtonLabel} completeButtonDisabled={completeButtonDisabled} onComplete={onComplete} isComicCompleted={isComicCompleted} completeButtonLabelWhenDone={completeButtonLabelWhenDone} />
      </div>
    </div>
  );
}
