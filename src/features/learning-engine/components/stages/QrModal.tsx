'use client';

import { useLayoutEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface QrModalProps {
  isOpen: boolean;
  qrSrc: string;
  onClose: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function QrModal({ isOpen, qrSrc, onClose, title = 'Model 3D Candi Jawi', description = 'Scan QR Code berikut untuk membuka model 3D menggunakan perangkat lain.', loading = false }: QrModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    if (!isOpen || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverflowX = document.body.style.overflowX;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.overflowX = previousOverflowX;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const isImage = qrSrc.startsWith('data:') || /\.(png|jpe?g|webp|svg)$/i.test(qrSrc);

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.35)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-[380px] max-w-[92vw] max-h-[85vh] overflow-auto rounded-[24px] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
        style={{ width: '380px', maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto', borderRadius: '24px', backgroundColor: '#ffffff', boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)', border: '1px solid #e5e7eb' }}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-600">QR Code</p>
              <h3 id={titleId} className="mt-1 text-lg font-black text-neutral-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
              aria-label="Tutup dialog QR"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex justify-center overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-3 sm:p-4">
            {loading ? (
              <div className="flex h-[280px] w-[280px] max-w-full items-center justify-center rounded-[16px] border border-neutral-200 bg-neutral-50 p-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : qrSrc ? (
              isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt={`QR ${title}`}
                  className="h-auto w-full max-w-[280px] rounded-[16px] border border-neutral-200 bg-white object-contain p-2 sm:max-w-[300px]"
                  style={{ maxHeight: 'min(56vh, 320px)' }}
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
              <div className="flex h-[280px] w-[280px] max-w-full items-center justify-center rounded-[16px] border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                QR Code tidak tersedia
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
