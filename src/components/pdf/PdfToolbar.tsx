interface PdfToolbarProps {
  currentPage: number;
  totalPages: number;
  progress: number;
}

export default function PdfToolbar({ currentPage, totalPages, progress }: PdfToolbarProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 bg-white px-3 py-2 shadow-sm">
      <span className="flex-shrink-0 text-sm font-bold text-neutral-700 tabular-nums">
        {totalPages > 0 ? `${currentPage} / ${totalPages}` : "…"}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-1.5 rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
