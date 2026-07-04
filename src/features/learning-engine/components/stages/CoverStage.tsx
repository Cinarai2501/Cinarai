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
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Cover image */}
      <div className="-mx-3 sm:mx-0">
        <div className="relative w-full aspect-[3/4] sm:rounded-2xl overflow-hidden shadow-sm bg-neutral-200">
          <Image
            src={comic.cover}
            alt={`Cover ${comic.title}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 640px) 100vw, 672px"
          />
        </div>
      </div>

      {/* Judul & meta */}
      <div className="rounded-2xl bg-white shadow-sm px-5 py-5">
        <div className="flex flex-wrap gap-2 mb-3">
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
        <h2 className="text-2xl font-black text-neutral-950 leading-snug">{comic.title}</h2>
        <p className="mt-2 text-xl text-neutral-500 leading-relaxed">{comic.subtitle}</p>
      </div>

      {/* Target Pembelajaran */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">🎯 Yang Akan Kamu Pelajari</h3>
        </div>
        <ul className="px-4 py-4 flex flex-col gap-3">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-4 rounded-2xl bg-primary-50 p-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-base font-black text-white mt-0.5">
                {i + 1}
              </span>
              <p className="text-xl text-neutral-700 leading-relaxed pt-1">{target}</p>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
