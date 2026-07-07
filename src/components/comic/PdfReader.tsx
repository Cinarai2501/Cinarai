"use client";

import dynamic from "next/dynamic";
import type { ComicAsset } from "@/lib/comicAsset";

const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), { ssr: false });

interface PdfReaderProps {
  asset?: ComicAsset | null;
  pdfPath?: string | null;
  comicTitle?: string;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
}

export default function PdfReader({
  asset,
  pdfPath,
  comicTitle,
  onComplete,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onPageChange,
}: PdfReaderProps) {
  const resolvedPdfPath = asset?.sourcePdfPath ?? pdfPath ?? "";
  const resolvedTitle = comicTitle ?? asset?.title ?? undefined;

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
      onComplete={onComplete}
      showCompleteButton={showCompleteButton}
      completeButtonLabel={completeButtonLabel}
      completeButtonDisabled={completeButtonDisabled}
      onPageChange={onPageChange}
    />
  );
}
