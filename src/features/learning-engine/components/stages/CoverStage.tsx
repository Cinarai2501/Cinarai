 'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function CoverStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  const hours = Math.floor(comic.estimatedMinutes / 60);
  const minutes = comic.estimatedMinutes % 60;
  const estimasiLabel = hours > 0
    ? `${hours} jam ${minutes > 0 ? `${minutes} menit` : ''}`.trim()
    : `${minutes} menit`;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up overflow-x-hidden">

      {/* ── Mobile/tablet: stacked. Desktop: side-by-side ── */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 xl:grid-cols-[360px_1fr]">

        {/* Cover image */}
        <div className="-mx-3 sm:mx-0 lg:mx-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-neutral-200 shadow-sm sm:rounded-[24px]">
            <Image src={comic.cover} alt={`Cover ${comic.title}`} fill className="object-cover" priority />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-4 mt-4 lg:mt-0">

          {/* Judul & meta */}
          <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
                📍 {comic.lokasi}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
                📚 Kelas {comic.kelas}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-600">
                ⏱ {estimasiLabel}
              </span>
            </div>
            <h2 className="text-lg font-black leading-snug text-neutral-950 md:text-2xl">{comic.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 md:text-base">{comic.subtitle}</p>
          </div>

          {/* Target Pembelajaran */}
          <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
              <h3 className="text-base font-black text-neutral-700 md:text-lg">🎯 Yang Akan Kamu Pelajari</h3>
            </div>
            <ul className="flex flex-col gap-3 px-4 py-4 sm:px-5">
              {comic.learningTargets.map((target, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-primary-50 p-3 sm:gap-4 sm:p-4">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-black text-white sm:h-9 sm:w-9 sm:text-base">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-neutral-700 sm:text-base">{target}</p>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
