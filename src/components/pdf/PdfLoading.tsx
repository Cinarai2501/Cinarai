export default function PdfLoading() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      <p className="text-sm font-semibold text-neutral-400">Memuat halaman...</p>
    </div>
  );
}
