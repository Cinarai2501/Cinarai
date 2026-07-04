'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import StageHero from '../StageHero';

export default function NavigationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">
      <StageHero
        cover={comic.cover}
        title={comic.title}
        emoji="🧭"
        stageName="Navigasi Cerita"
        lokasi={comic.lokasi}
      />

      <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h2 className="text-xl font-black text-neutral-950 leading-snug">Navigasi Cerita</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{comic.subtitle}</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">📚 Materi Pembelajaran</h3>
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

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">🎮 Aktivitas</h3>
        </div>
        <div className="px-3 py-2.5 flex flex-col gap-1.5">
          {[
            { emoji: '📷', title: 'Scan AR', desc: `Arahkan kamera ke marker ${comic.lokasi} untuk melihat objek 3D.` },
            { emoji: '🤖', title: 'Tanya AI', desc: 'Ajukan pertanyaan tentang materi kepada asisten AI.' },
            { emoji: '📝', title: 'Kuis Navigasi', desc: 'Uji pemahamanmu tentang materi yang sudah dipelajari.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="min-w-0">
                <p className="text-base font-black text-neutral-800 leading-tight">{item.title}</p>
                <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
                <span className="mt-1.5 inline-block rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-bold text-warning-700">
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

