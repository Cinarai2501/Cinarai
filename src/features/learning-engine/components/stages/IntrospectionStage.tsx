'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

// ---------------------------------------------------------------------------
// Refleksi
// ---------------------------------------------------------------------------
function Refleksi() {
  const { comic } = useLearningEngine();
  return (
    <div>
      <h2 className="text-lg font-bold text-neutral-950 leading-snug">Refleksi Pembelajaran</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Kamu telah menyelesaikan petualangan di {comic.lokasi}. Luangkan waktu untuk merenungkan
        apa yang sudah kamu pelajari tentang {comic.subtitle.toLowerCase()}.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------
interface ChecklistProps {
  checked: boolean[];
  onChange: (i: number, v: boolean) => void;
}

function Checklist({ checked, onChange }: ChecklistProps) {
  const { comic } = useLearningEngine();
  return (
    <section className="rounded-3xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 sm:px-5 border-b border-neutral-100">
        <h3 className="text-sm font-bold text-neutral-800">Apa yang sudah kamu kuasai?</h3>
        <p className="mt-0.5 text-xs text-neutral-400">Centang semua yang sudah kamu pahami.</p>
      </div>
      <ul className="px-4 py-3 sm:px-5 flex flex-col gap-1">
        {comic.learningTargets.map((target, i) => (
          <li key={i}>
            <label className="flex items-start gap-3 rounded-xl p-3 cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={(e) => onChange(i, e.target.checked)}
                className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span className={`text-sm leading-relaxed ${checked[i] ? 'text-neutral-800 font-medium' : 'text-neutral-600'}`}>
                {target}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Rating Pemahaman
// ---------------------------------------------------------------------------
const RATING_OPTIONS = [
  { value: 1, label: 'Belum paham', emoji: '😕' },
  { value: 2, label: 'Sedikit paham', emoji: '🤔' },
  { value: 3, label: 'Cukup paham', emoji: '🙂' },
  { value: 4, label: 'Paham', emoji: '😊' },
  { value: 5, label: 'Sangat paham', emoji: '🤩' },
] as const;

interface RatingProps {
  value: number | null;
  onChange: (v: number) => void;
}

function RatingPemahaman({ value, onChange }: RatingProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Rating Pemahaman
        </h3>
        <p className="mt-1 text-sm text-neutral-500">Seberapa paham kamu dengan materi ini?</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {RATING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 min-w-[60px] flex-1 transition-colors ${
              value === opt.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <span className="text-xl leading-none">{opt.emoji}</span>
            <span className="text-xs font-medium text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
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
        htmlFor="introspection-note"
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Catatan
      </label>
      <textarea
        id="introspection-note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Hal yang ingin kamu ingat, pertanyaan yang masih ada, atau perasaanmu... (opsional)"
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none leading-relaxed"
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Kesimpulan
// ---------------------------------------------------------------------------
interface KesimpulanProps {
  value: string;
  onChange: (v: string) => void;
}

function Kesimpulan({ value, onChange }: KesimpulanProps) {
  const { comic } = useLearningEngine();
  return (
    <section className="flex flex-col gap-2">
      <label
        htmlFor="introspection-summary"
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Kesimpulan
      </label>
      <p className="text-sm text-neutral-500">
        Dengan kata-katamu sendiri, apa pelajaran terpenting yang kamu dapat dari {comic.lokasi}?
      </p>
      <textarea
        id="introspection-summary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Tuliskan kesimpulanmu di sini..."
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none leading-relaxed"
      />
      <p className="text-xs text-neutral-400 text-right">{value.trim().length} karakter</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tombol Selesai
// ---------------------------------------------------------------------------
interface TombolSelesaiProps {
  disabled: boolean;
  onFinish: () => void;
}

function TombolSelesai({ disabled, onFinish }: TombolSelesaiProps) {
  return (
    <button
      type="button"
      onClick={onFinish}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
      Selesaikan Learning Journey
    </button>
  );
}

// ---------------------------------------------------------------------------
// IntrospectionStage
// ---------------------------------------------------------------------------
export default function IntrospectionStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();

  const [checked, setChecked] = useState<boolean[]>(() =>
    comic.learningTargets.map(() => false)
  );
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  const allChecked = checked.every(Boolean);
  const canFinish = allChecked && rating !== null && summary.trim().length > 0;

  // Gate: tombol Next di BottomNav dinonaktifkan — navigasi via tombol Selesai
  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  const handleCheck = (i: number, v: boolean) => {
    setChecked((prev) => prev.map((c, idx) => (idx === i ? v : c)));
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <Refleksi />
      <Checklist checked={checked} onChange={handleCheck} />
      <RatingPemahaman value={rating} onChange={setRating} />
      <Catatan value={note} onChange={setNote} />
      <Kesimpulan value={summary} onChange={setSummary} />
      <TombolSelesai disabled={!canFinish} onFinish={nextStage} />
    </div>
  );
}
