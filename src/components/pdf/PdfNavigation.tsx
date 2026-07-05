import type { ReactNode } from "react";

interface PdfNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  completeButton?: ReactNode;
}

export default function PdfNavigation({
  onPrev,
  onNext,
  isFirstPage,
  isLastPage,
  completeButton,
}: PdfNavigationProps) {
  if (completeButton) {
    return (
      <div className="flex-shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        {completeButton}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5"
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
