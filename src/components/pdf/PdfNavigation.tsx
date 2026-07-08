"use client";

import { useRef, useEffect } from "react";

interface PdfNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onComplete?: () => void;
  isComicCompleted?: boolean;
  completeButtonLabelWhenDone?: string;
}

export default function PdfNavigation({
  onPrev,
  onNext,
  isFirstPage,
  isLastPage,
  showCompleteButton = false,
  completeButtonLabel = "🎉 Selesai Membaca",
  completeButtonDisabled = false,
  onComplete,
  isComicCompleted = false,
  completeButtonLabelWhenDone = "Lanjut ke Identification",
}: PdfNavigationProps) {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const completeButton = isLastPage && showCompleteButton && onComplete ? (
    <button
      onClick={() => onCompleteRef.current?.()}
      disabled={completeButtonDisabled}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-base font-black text-white shadow-md transition-all hover:from-green-600 hover:to-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {completeButtonDisabled ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Menyimpan...
        </>
      ) : (
        isComicCompleted ? completeButtonLabelWhenDone : completeButtonLabel
      )}
    </button>
  ) : null;

  if (completeButton) {
    return (
      <div
        className="flex-shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        {completeButton}
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={isFirstPage}
          aria-label="Halaman sebelumnya"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-700 text-base font-black text-neutral-200 transition-colors hover:bg-neutral-600 active:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Sebelumnya
        </button>
        <button
          onClick={onNext}
          disabled={isLastPage}
          aria-label="Halaman berikutnya"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 text-base font-black text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Selanjutnya
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

