'use client';

import { useState } from 'react';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import { ObjectAITutor } from './ObjectAITutor';
import { normalizeShapeId } from '@/features/learning-engine/stages/Identification/services/shapeKnowledge';

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
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const objectId = normalizeShapeId(entry.title || entry.description || entry.arUrl);

  return (
    <div
      data-object-id={`${entry.page}-${entry.arUrl}`}
      onClick={onSelect}
      className={`rounded-[20px] bg-white px-4 py-4 transition duration-200 ${
        isActive ? 'shadow-[0_18px_50px_rgba(15,23,42,0.12)]' : 'shadow-sm hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]'
      } cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-neutral-900">{entry.title || 'Model 3D'}</h3>
          <p className="mt-1 text-sm text-neutral-500">Komik {entry.page} • Halaman {entry.page}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsTutorOpen((prev) => !prev);
          }}
          className="shrink-0 rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 active:scale-95"
        >
          Tanya AI
        </button>
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

      {isTutorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-2 sm:p-4" onClick={() => setIsTutorOpen(false)}>
          <div className="w-full max-w-2xl rounded-t-[28px] bg-white shadow-[0_28px_60px_rgba(15,23,42,0.16)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary-700">AI Tutor</p>
                <p className="text-sm font-black text-neutral-900">{entry.title || 'Objek 3D'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTutorOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto px-3 py-3 sm:px-4">
              <ObjectAITutor
                objectId={objectId}
                objectName={entry.title || 'Objek 3D'}
                provider={entry.provider}
                comicPage={entry.page}
                modelUrl={entry.arUrl}
                entry={entry}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
