"use client";

interface PdfLoadingProps {
  variant?: "full" | "skeleton" | "spinner";
  progress?: number;
}

export default function PdfLoading({ variant = "full", progress = 0 }: PdfLoadingProps) {
  if (variant === "skeleton") {
    return (
      <div className="w-full bg-neutral-100 p-2 sm:p-4">
        <div className="skeleton aspect-[8.5/11] w-full rounded-lg" />
      </div>
    );
  }

  if (variant === "spinner") {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
        <p className="text-xs font-semibold text-neutral-500">Memuat halaman...</p>
      </div>
    );
  }

  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm font-semibold text-neutral-600">Memuat komik...</p>
      </div>
      {progress > 0 && progress < 100 && (
        <div className="w-32 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-1 rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p className="text-xs text-neutral-400">Ini mungkin memerlukan beberapa saat...</p>
    </div>
  );
}
