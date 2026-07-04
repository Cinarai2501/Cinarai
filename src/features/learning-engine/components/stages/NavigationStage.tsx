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
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">🧭</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Navigasi Cerita</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Jelajahi <span className="font-black text-primary-600">{comic.lokasi}</span> lebih dalam!
        </p>
      </div>

      {/* Meta */}
      <div className="rounded-2xl bg-white shadow-sm px-5 py-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h3 className="text-2xl font-black text-neutral-950 leading-snug">{comic.title}</h3>
        <p className="mt-2 text-xl text-neutral-500 leading-relaxed">{comic.subtitle}</p>
      </div>

      {/* Materi Pembelajaran */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">📚 Materi Pembelajaran</h3>
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

      {/* Aktivitas */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">🎮 Aktivitas</h3>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          {[
            { emoji: '📷', title: 'Scan AR', desc: `Arahkan kamera ke marker ${comic.lokasi} untuk melihat objek 3D.` },
            { emoji: '🤖', title: 'Tanya AI', desc: 'Ajukan pertanyaan tentang materi kepada asisten AI.' },
            { emoji: '📝', title: 'Kuis Navigasi', desc: 'Uji pemahamanmu tentang materi yang sudah dipelajari.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-2xl bg-neutral-50 p-4">
              <span className="text-3xl flex-shrink-0">{item.emoji}</span>
              <div className="min-w-0">
                <p className="text-xl font-black text-neutral-800 leading-tight">{item.title}</p>
                <p className="text-lg text-neutral-500 mt-1 leading-relaxed">{item.desc}</p>
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
