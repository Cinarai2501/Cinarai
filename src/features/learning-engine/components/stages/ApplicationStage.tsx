'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

// ---------------------------------------------------------------------------
// Studi Kasus
// ---------------------------------------------------------------------------
interface StudiKasusProps {
  index: number;
  target: string;
  lokasi: string;
}

function StudiKasusCard({ index, target, lokasi }: StudiKasusProps) {
  return (
    <div className="rounded-2xl bg-white shadow-xs overflow-hidden">
      <div className="bg-secondary-600 px-4 py-3 sm:px-5 flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          {index + 1}
        </span>
        <h3 className="text-sm font-bold text-white">Studi Kasus {index + 1}</h3>
      </div>
      <div className="px-4 py-4 sm:px-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Situasi Baru
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Bayangkan kamu berada di tempat lain yang berbeda dari {lokasi}. Bagaimana kamu
          menerapkan konsep <span className="font-semibold text-neutral-900">{target.toLowerCase()}</span>{' '}
          pada situasi tersebut?
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area Jawaban
// ---------------------------------------------------------------------------
interface AreaJawabanProps {
  index: number;
  value: string;
  onChange: (v: string) => void;
}

function AreaJawaban({ index, value, onChange }: AreaJawabanProps) {
  const id = `application-answer-${index}`;
  return (
    <section className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Jawabanmu untuk Kasus {index + 1}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Tuliskan penerapan konsepmu di sini..."
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none leading-relaxed"
      />
      <p className="text-xs text-neutral-400 text-right">{value.trim().length} karakter</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Catatan
// ---------------------------------------------------------------------------
interface CatatanProps {
  value: string;
  onChange: (v: string) => void;
}

function Catatan({ value, onChange }: CatatanProps) {
  return (
    <section className="flex flex-col gap-2">
      <label
        htmlFor="application-note"
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Catatan Tambahan
      </label>
      <textarea
        id="application-note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Hal menarik, pertanyaan, atau hal yang ingin kamu ingat... (opsional)"
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none leading-relaxed"
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// ApplicationStage
// ---------------------------------------------------------------------------
export default function ApplicationStage() {
  const { comic, setCanAdvance } = useLearningEngine();
  const [answers, setAnswers] = useState<string[]>(() =>
    comic.learningTargets.map(() => '')
  );
  const [note, setNote] = useState('');

  // Gate: semua jawaban harus terisi
  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  useEffect(() => {
    const allFilled = answers.every((a) => a.trim().length > 0);
    setCanAdvance(allFilled);
  }, [answers, setCanAdvance]);

  const handleAnswer = (i: number, v: string) => {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Judul */}
      <div>
        <h2 className="text-lg font-bold text-neutral-950 leading-snug">Penerapan Konsep</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Terapkan apa yang kamu pelajari dari {comic.lokasi} pada situasi baru.
        </p>
      </div>

      {/* Studi Kasus + Area Jawaban per target */}
      {comic.learningTargets.map((target, i) => (
        <div key={i} className="flex flex-col gap-3">
          <StudiKasusCard index={i} target={target} lokasi={comic.lokasi} />
          <AreaJawaban index={i} value={answers[i] ?? ''} onChange={(v) => handleAnswer(i, v)} />
        </div>
      ))}

      <Catatan value={note} onChange={setNote} />
    </div>
  );
}
