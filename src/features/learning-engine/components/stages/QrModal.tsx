'use client';

interface QrModalProps {
  isOpen: boolean;
  qrSrc: string;
  onClose: () => void;
}

export function QrModal({ isOpen, qrSrc, onClose }: QrModalProps) {
  if (!isOpen) return null;

  const isImage = qrSrc.startsWith('data:') || /\.(png|jpe?g|webp|svg)$/i.test(qrSrc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[24px] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl font-black text-neutral-900">Scan QR untuk Membuka Model AR</h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              Gunakan kamera pada HP orang tua atau perangkat lain untuk memindai QR dan membuka model AR.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup QR"
            className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] bg-neutral-50 p-4">
          {qrSrc ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="QR Code"
                className="h-[280px] w-[280px] max-w-full object-contain"
              />
            ) : (
              <a
                href={qrSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary-600 underline hover:text-primary-700"
              >
                Buka Link
              </a>
            )
          ) : (
            <p className="text-center text-sm text-neutral-500">QR Code tidak tersedia</p>
          )}
        </div>

        {qrSrc ? (
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={qrSrc}
              download
              className="inline-flex min-h-[48px] items-center justify-center rounded-[20px] border border-neutral-200 bg-white px-4 py-4 text-sm font-bold text-neutral-900 transition hover:bg-neutral-100"
            >
              Download QR
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[20px] bg-primary-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-95"
            >
              Kembali
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-[20px] bg-primary-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-95 min-h-[48px]"
          >
            Kembali
          </button>
        )}
      </div>
    </div>
  );
}
