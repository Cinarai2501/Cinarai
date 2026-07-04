'use client';

import Image from 'next/image';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function CoverStage() {
  const { comic } = useLearningEngine();

  const hours = Math.floor(comic.estimatedMinutes / 60);
  const minutes = comic.estimatedMinutes % 60;
  const estimasiLabel = hours > 0
    ? `${hours} jam ${minutes > 0 ? `${minutes} menit` : ''}`.trim()
    : `${minutes} menit`;

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">

      {/* ── Hero: cover image ── */}
      <div className="-mx-3 sm:mx-0">
        <div className="relative w-full aspect-[3/4] sm:rounded-2xl overflow-hidden shadow-md bg-neutral-200">
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

      {/* ── Judul & meta ── */}
      <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
            ⏱ {estimasiLabel}
          </span>
        </div>
        <h2 className="text-xl font-black text-neutral-950 leading-snug">{comic.title}</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{comic.subtitle}</p>
      </div>

      {/* ── Target Pembelajaran ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">🎯 Yang Akan Kamu Pelajari</h3>
        </div>
        <ul className="px-3 py-2.5 flex flex-col gap-1.5">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-black text-primary-700 mt-0.5">
                {i + 1}
              </span>
              <p className="text-base text-neutral-700 leading-relaxed">{target}</p>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
