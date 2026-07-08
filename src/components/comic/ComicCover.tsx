"use client";

import Image from 'next/image';
import { useMemo, useState } from "react";
import { COMICS } from "@/data/comics";

interface ComicCoverProps {
  comicId: number;
}

export default function ComicCover({ comicId }: ComicCoverProps) {
  const comic = useMemo(() => COMICS.find((item) => item.id === comicId) ?? null, [comicId]);
  const [imageError, setImageError] = useState(false);

  if (!comic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f7ff] px-6">
        <div className="rounded-3xl border border-primary-100 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-primary-700">Cover komik tidak tersedia</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6">
        <div className="w-full max-w-[420px] rounded-[32px] border border-primary-100 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-4">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[24px] bg-neutral-100">
            {!imageError ? (
              <Image
                src={comic.cover}
                alt={`Cover ${comic.title}`}
                fill
                className="object-cover"
                priority
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 to-primary-100 px-6 text-center">
                <span className="text-5xl">📖</span>
                <p className="text-sm font-bold text-primary-700">{comic.title}</p>
                <p className="text-xs text-primary-500">Cover tidak tersedia</p>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">{comic.title}</h1>
          <p className="mt-2 text-sm text-primary-700 sm:text-base">{comic.subtitle}</p>
        </div>
      </div>
    </main>
  );
}
