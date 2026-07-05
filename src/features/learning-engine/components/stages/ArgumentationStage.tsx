'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function ArgumentationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-[24px] bg-white px-5 py-7 text-center shadow-sm sm:px-6 sm:py-8">
        <div className="mb-4 text-3xl sm:text-5xl">💬</div>
        <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Argumentasi</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Sampaikan pendapatmu tentang{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span>!
        </p>
      </div>

      {/* Meta */}
      <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h3 className="text-lg font-black leading-snug text-neutral-950 sm:text-xl">{comic.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Sampaikan pendapatmu tentang {comic.subtitle.toLowerCase()}.
        </p>
      </div>

      {/* Apa itu Argumentasi */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">💡 Apa itu Argumentasi?</h3>
        </div>
        <ul className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          {[
            { emoji: '🗣️', text: 'Sampaikan pendapatmu dengan jelas dan percaya diri.' },
            { emoji: '📌', text: 'Dukung pendapatmu dengan bukti dari cerita komik.' },
            { emoji: '🤝', text: 'Dengarkan pendapat teman dan hargai perbedaan.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-primary-50 p-3 sm:gap-4 sm:p-4">
              <span className="flex-shrink-0 text-2xl sm:text-3xl">{item.emoji}</span>
              <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Aktivitas placeholder */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">🎯 Aktivitas Argumentasi</h3>
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-5 sm:py-10">
          <span className="text-2xl sm:text-4xl">🚧</span>
          <p className="text-base font-black text-neutral-700 sm:text-lg">Segera Hadir!</p>
          <p className="max-w-xs text-sm leading-relaxed text-neutral-400 sm:text-base">
            Aktivitas diskusi dan argumentasi interaktif akan segera tersedia di sini.
          </p>
          <span className="rounded-full bg-warning-100 px-4 py-2 text-sm md:text-base font-bold text-warning-700">
            Dalam Pengembangan
          </span>
        </div>
      </div>

    </div>
  );
}
