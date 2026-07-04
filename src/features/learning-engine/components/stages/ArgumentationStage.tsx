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
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">💬</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Argumentasi</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Sampaikan pendapatmu tentang{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span>!
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
        <p className="mt-2 text-xl text-neutral-500 leading-relaxed">
          Sampaikan pendapatmu tentang {comic.subtitle.toLowerCase()}.
        </p>
      </div>

      {/* Apa itu Argumentasi */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">💡 Apa itu Argumentasi?</h3>
        </div>
        <ul className="px-4 py-4 flex flex-col gap-3">
          {[
            { emoji: '🗣️', text: 'Sampaikan pendapatmu dengan jelas dan percaya diri.' },
            { emoji: '📌', text: 'Dukung pendapatmu dengan bukti dari cerita komik.' },
            { emoji: '🤝', text: 'Dengarkan pendapat teman dan hargai perbedaan.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-4 rounded-2xl bg-primary-50 p-4">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <p className="text-xl text-neutral-700 leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Aktivitas placeholder */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">🎯 Aktivitas Argumentasi</h3>
        </div>
        <div className="px-5 py-10 flex flex-col items-center gap-4 text-center">
          <span className="text-6xl">🚧</span>
          <p className="text-2xl font-black text-neutral-700">Segera Hadir!</p>
          <p className="text-xl text-neutral-400 leading-relaxed max-w-xs">
            Aktivitas diskusi dan argumentasi interaktif akan segera tersedia di sini.
          </p>
          <span className="rounded-full bg-warning-100 px-4 py-2 text-base font-bold text-warning-700">
            Dalam Pengembangan
          </span>
        </div>
      </div>

    </div>
  );
}
