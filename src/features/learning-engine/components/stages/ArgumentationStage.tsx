'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import StageHero from '../StageHero';

export default function ArgumentationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">

      <StageHero
        cover={comic.cover}
        title={comic.title}
        emoji="💬"
        stageName="Argumentasi"
        lokasi={comic.lokasi}
      />

      {/* Judul & meta */}
      <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h2 className="text-xl font-black text-neutral-950 leading-snug">Argumentasi</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Sampaikan pendapatmu tentang {comic.subtitle.toLowerCase()}.
        </p>
      </div>

      {/* Petunjuk */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">💡 Apa itu Argumentasi?</h3>
        </div>
        <ul className="px-3 py-2.5 flex flex-col gap-1.5">
          {[
            { emoji: '🗣️', text: 'Sampaikan pendapatmu dengan jelas dan percaya diri.' },
            { emoji: '📌', text: 'Dukung pendapatmu dengan bukti dari cerita komik.' },
            { emoji: '🤝', text: 'Dengarkan pendapat teman dan hargai perbedaan.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <p className="text-base text-neutral-700 leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Aktivitas placeholder */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">🎯 Aktivitas Argumentasi</h3>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">🚧</span>
          <p className="text-base font-bold text-neutral-700">Segera Hadir!</p>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
            Aktivitas diskusi dan argumentasi interaktif akan segera tersedia di sini.
          </p>
          <span className="rounded-full bg-warning-100 px-3 py-1 text-xs font-bold text-warning-700">
            Dalam Pengembangan
          </span>
        </div>
      </div>

    </div>
  );
}

      {/* Petunjuk */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">💡 Apa itu Argumentasi?</h3>
        </div>
        <div className="px-4 py-3 flex flex-col gap-1.5">
          {[
            { emoji: '🗣️', text: 'Sampaikan pendapatmu dengan jelas dan percaya diri.' },
            { emoji: '📌', text: 'Dukung pendapatmu dengan bukti dari cerita komik.' },
            { emoji: '🤝', text: 'Dengarkan pendapat teman dan hargai perbedaan.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <p className="text-sm text-neutral-700 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aktivitas placeholder */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">🎯 Aktivitas Argumentasi</h3>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">🚧</span>
          <p className="text-sm font-bold text-neutral-700">Segera Hadir!</p>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
            Aktivitas diskusi dan argumentasi interaktif akan segera tersedia di sini.
          </p>
          <span className="rounded-full bg-warning-100 px-3 py-1 text-xs font-bold text-warning-700">
            Dalam Pengembangan
          </span>
        </div>
      </div>

    </div>
  );
}
