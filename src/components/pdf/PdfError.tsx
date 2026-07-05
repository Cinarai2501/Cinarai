export default function PdfError() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-600">Gagal memuat PDF.</p>
      <p className="text-sm text-red-500">Silakan coba lagi nanti.</p>
    </div>
  );
}
