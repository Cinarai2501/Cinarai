'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function NavigationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-[24px] bg-white px-5 py-7 text-center shadow-sm sm:px-6 sm:py-8">
        <div className="mb-4 text-3xl sm:text-5xl">🧭</div>
        <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Navigasi Cerita</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Jelajahi <span className="font-black text-primary-600">{comic.lokasi}</span> lebih dalam!
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
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">{comic.subtitle}</p>
      </div>

      {/* Materi Pembelajaran */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">📚 Materi Pembelajaran</h3>
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

      {/* Aktivitas */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">🎮 Aktivitas</h3>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          {[
            { emoji: '📷', title: 'Scan AR', desc: `Arahkan kamera ke marker ${comic.lokasi} untuk melihat objek 3D.` },
            { emoji: '🤖', title: 'Tanya AI', desc: 'Ajukan pertanyaan tentang materi kepada asisten AI.' },
            { emoji: '📝', title: 'Kuis Navigasi', desc: 'Uji pemahamanmu tentang materi yang sudah dipelajari.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-3 sm:gap-4 sm:p-4">
              <span className="flex-shrink-0 text-2xl sm:text-3xl">{item.emoji}</span>
              <div className="min-w-0">
                <p className="text-base font-black leading-tight text-neutral-800 sm:text-lg">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500 sm:text-base">{item.desc}</p>
                <span className="mt-2 inline-block rounded-full bg-warning-100 px-3 py-1 text-sm font-bold text-warning-700">
                  🚧 Segera Hadir
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
