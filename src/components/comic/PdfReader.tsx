"use client";

import dynamic from "next/dynamic";
import type { ComicAsset } from "@/lib/comicAsset";
import { useComicReadingProgress } from '@/context/ComicReadingProgressContext';

const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), { ssr: false });

interface PdfReaderProps {
  asset?: ComicAsset | null;
  pdfPath?: string | null;
  comicTitle?: string;
  comicId?: number;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
  isComicCompleted?: boolean;
  completeButtonLabelWhenDone?: string;
}

export default function PdfReader({
  asset,
  pdfPath,
  comicTitle,
  comicId,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onPageChange,
  isComicCompleted = false,
  completeButtonLabelWhenDone = "Lanjut ke Identification",
}: PdfReaderProps) {
  const { getLastPage } = useComicReadingProgress();

  const getInitialPage = (): number => {
    if (!comicId) return 1;
    try {
      return getLastPage(comicId) || 1;
    } catch {
      return 1;
    }
  };

  const resolvedPdfPath = asset?.sourcePdfPath ?? pdfPath ?? "";
  const resolvedTitle = comicTitle ?? asset?.title ?? undefined;
  const initialPage = getInitialPage();

  if (!resolvedPdfPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#f5f7fa] px-6 text-center">
        <p className="text-base font-black text-neutral-700">Komik tidak bisa dimuat</p>
        <p className="text-sm text-neutral-500">PDF belum tersedia.</p>
      </div>
    );
  }

  return (
    <PdfViewer
      pdfPath={resolvedPdfPath}
      comicTitle={resolvedTitle}
      comicId={comicId}
      onComplete={onComplete}
      showCompleteButton={showCompleteButton}
      completeButtonLabel={completeButtonLabel}
      completeButtonDisabled={completeButtonDisabled}
      onPageChange={onPageChange}
      isComicCompleted={isComicCompleted}
      completeButtonLabelWhenDone={completeButtonLabelWhenDone}
      initialPage={initialPage}
    />
  );
}
