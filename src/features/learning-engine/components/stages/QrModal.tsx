'use client';

interface QrModalProps {
  isOpen: boolean;
  qrSrc: string;
  onClose: () => void;
}

export function QrModal({ isOpen, qrSrc, onClose }: QrModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[380px] rounded-[24px] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-600">Pindai dengan Assemblr</p>
          <h2 className="text-2xl font-black text-neutral-900">QR Code</h2>
        </div>

        <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] bg-neutral-50 p-4">
          {qrSrc ? (
            (qrSrc.startsWith('data:') || /\.(png|jpe?g|webp|svg)$/i.test(qrSrc)) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="QR Code"
                className="h-[280px] w-[280px] object-contain"
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

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-[20px] bg-primary-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-95 min-h-[48px]"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
