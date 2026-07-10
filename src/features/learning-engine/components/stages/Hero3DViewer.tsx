'use client';

import { useState } from 'react';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

interface Hero3DViewerProps {
  entry: ComicAssetEntry | null;
}

export function Hero3DViewer({ entry }: Hero3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!entry || entry.viewerType !== 'embed' || !entry.embedUrl) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[20px] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Objek Utama</p>
        <h2 className="text-2xl font-black text-neutral-900">{entry.title}</h2>
      </div>

      <div className="overflow-hidden rounded-[20px] bg-neutral-100">
        <div className="relative aspect-[16/9] w-full">
          <iframe
            src={entry.embedUrl}
            title={`Model 3D ${entry.title}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen"
            onLoad={() => setIsLoading(false)}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
