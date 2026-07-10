'use client';

import type { ComicAssetEntry } from '@/services/comic-assets/types';

interface AssemblrCardProps {
  entry: ComicAssetEntry;
  isActive: boolean;
  onSelect: () => void;
  onOpenAr: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenQr: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isValidUrl: boolean;
}

export function AssemblrCard({
  entry,
  isActive,
  onSelect,
  onOpenAr,
  onOpenQr,
  isValidUrl,
}: AssemblrCardProps) {
  if (entry.viewerType === 'embed') {
    return null;
  }

  return (
    <div
      data-object-id={`${entry.page}-${entry.arUrl}`}
      onClick={onSelect}
      className={`rounded-[20px] bg-white px-4 py-4 transition duration-200 ${
        isActive ? 'shadow-[0_18px_50px_rgba(15,23,42,0.12)]' : 'shadow-sm hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]'
      } cursor-pointer`}
    >
      <div className="min-w-0">
        <h3 className="text-lg font-black text-neutral-900">{entry.title || 'Model 3D'}</h3>
        <p className="mt-1 text-sm text-neutral-500">Komik {entry.page} • Halaman {entry.page}</p>
      </div>

      {entry.description ? (
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{entry.description}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAr(event);
          }}
          disabled={!isValidUrl}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[20px] bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lihat Model 3D
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenQr(event);
          }}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[20px] border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50 active:scale-95"
        >
          Tampilkan QR
        </button>
      </div>
    </div>
  );
}
