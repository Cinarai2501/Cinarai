'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

// ---------------------------------------------------------------------------
// Ringkasan Identifikasi
// ---------------------------------------------------------------------------
function RingkasanIdentifikasi() {
  const { comic } = useLearningEngine();

  return (
    <section className="rounded-3xl bg-white shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-white">Ringkasan Identifikasi</h2>
        <p className="mt-0.5 text-xs text-primary-100">
          Hal-hal yang sudah kamu temukan di {comic.lokasi}
        </p>
      </div>
      <ul className="px-4 py-4 sm:px-5 flex flex-col gap-2">
        {comic.learningTargets.map((target, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {i + 1}
            </span>
            <p className="text-sm text-neutral-700 leading-relaxed">{target}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Kotak Jawaban
// ---------------------------------------------------------------------------
interface KotakJawabanProps {
  value: string;
  onChange: (v: string) => void;
}

function KotakJawaban({ value, onChange }: KotakJawabanProps) {
  const { comic } = useLearningEngine();

  return (
    <section className="flex flex-col gap-2">
      <label
        htmlFor="resolution-answer"
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Jawaban Kamu
      </label>
      <p className="text-sm text-neutral-500">
        Berdasarkan penjelajahanmu di {comic.lokasi}, tuliskan kesimpulanmu tentang{' '}
        {comic.subtitle.toLowerCase()}.
      </p>
      <textarea
        id="resolution-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Tulis jawabanmu di sini..."
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
        htmlFor="resolution-note"
        className="text-xs font-semibold uppercase tracking-widest text-neutral-400"
      >
        Catatan Tambahan
      </label>
      <textarea
        id="resolution-note"
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
// Feedback Placeholder
// ---------------------------------------------------------------------------
function FeedbackPlaceholder() {
  return (
    <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 sm:px-5 flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-neutral-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347A3.001 3.001 0 0112 21a3.001 3.001 0 01-2.121-.879l-.347-.347z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-600">Feedback AI</p>
        <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed">
          Setelah kamu menulis jawaban, AI akan memberikan umpan balik dan saran perbaikan.
        </p>
        <span className="mt-2 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-500">
          Segera Hadir
        </span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ResolutionStage
// ---------------------------------------------------------------------------
export default function ResolutionStage() {
  const { setCanAdvance } = useLearningEngine();
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');

  // Gate: tombol Next aktif hanya jika jawaban tidak kosong
  useEffect(() => {
    setCanAdvance(answer.trim().length > 0);
  }, [answer, setCanAdvance]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <RingkasanIdentifikasi />
      <KotakJawaban value={answer} onChange={setAnswer} />
      <Catatan value={note} onChange={setNote} />
      <FeedbackPlaceholder />
    </div>
  );
}
