'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function ResolutionStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();
  const [misiStarted, setMisiStarted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [resolutionCompleted, setResolutionCompleted] = useState(false);

  // Cover screen: lock advance until misi diselesaikan (jawaban benar)
  useEffect(() => {
    // Always lock stage navigation while mission is active; will be
    // unlocked when siswa memberikan jawaban yang benar.
    setCanAdvance(false);
  }, [misiStarted, setCanAdvance]);

  if (!misiStarted) {
    return <ResolutionCover comic={comic} onStart={() => setMisiStarted(true)} />;
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Stage header */}
      <header className="rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <span className="text-lg font-black text-white">6</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Resolution</p>
            <h2 className="mt-0.5 text-base font-black text-white sm:text-lg">Misi Bangun Ruang</h2>
          </div>
        </div>
      </header>

      {!resolutionCompleted ? (
        <MisiKubus selected={selected} onSelect={setSelected} onComplete={() => setResolutionCompleted(true)} />
      ) : (
        <SummaryPage onContinue={() => void nextStage()} />
      )}

    </div>
  );
}

// ─── SummaryPage ────────────────────────────────────────────────────────────
function SummaryPage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-sm px-5 py-6">
      <h3 className="text-lg font-black text-neutral-900">Ringkasan</h3>
      <p className="mt-2 text-sm text-neutral-700">Kamu telah menyelesaikan tahap Resolution. Berikut ringkasan aktivitas:</p>

      <ul className="mt-4 flex flex-col gap-3">
        <li className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-700">✓</span>
          <span className="text-sm font-bold text-neutral-800">Model AR telah diamati</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-700">✓</span>
          <span className="text-sm font-bold text-neutral-800">Tantangan numerasi selesai</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-700">✓</span>
          <span className="text-sm font-bold text-neutral-800">AI telah memberikan validasi</span>
        </li>
      </ul>

      <div className="mt-6">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-secondary-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-secondary-600"
        >
          Lanjut ke Application
        </button>
      </div>
    </div>
  );
}

// ─── KubusSvg ────────────────────────────────────────────────────────────────

function KubusSvg() {
  return (
    <svg
      viewBox="0 0 160 140"
      className="w-full max-w-[180px]"
      aria-label="Ilustrasi kubus dengan rusuk 8 cm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Front face */}
      <rect x="30" y="50" width="80" height="80" rx="2"
        fill="#e0f0ff" stroke="#1875cc" strokeWidth="2" />
      {/* Top face */}
      <polygon points="30,50 70,20 150,20 110,50"
        fill="#c1e1ff" stroke="#1875cc" strokeWidth="2" />
      {/* Right face */}
      <polygon points="110,50 150,20 150,100 110,130"
        fill="#a1d2ff" stroke="#1875cc" strokeWidth="2" />
      {/* Dashed back edges */}
      <line x1="30" y1="50" x2="70" y2="20" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Dimension label — rusuk */}
      <text x="68" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1875cc">s = 8 cm</text>
      {/* Tick marks on front bottom edge */}
      <line x1="30" y1="132" x2="110" y2="132" stroke="#1875cc" strokeWidth="1" />
      <line x1="30" y1="129" x2="30" y2="135" stroke="#1875cc" strokeWidth="1.5" />
      <line x1="110" y1="129" x2="110" y2="135" stroke="#1875cc" strokeWidth="1.5" />
    </svg>
  );
}

// ─── MisiKubus ────────────────────────────────────────────────────────────────

const OPTIONS = [
  { key: 'A', label: '256 cm³' },
  { key: 'B', label: '384 cm³' },
  { key: 'C', label: '512 cm³' },
  { key: 'D', label: '640 cm³' },
];

function MisiKubus({
  selected,
  onSelect,
  onComplete,
}: {
  selected: string | null;
  onSelect: (key: string) => void;
  onComplete?: () => void;
}) {
  const { setCanAdvance } = useLearningEngine();
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  // Reset hints when selection changes
  useEffect(() => {
    if (!selected) return;
    setHint(null);
  }, [selected]);

  async function handleSubmitAnswer() {
    if (!selected || isSolved || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ai/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected, attempt: attempts + 1 }),
      });
      const data = await res.json();

      if (data.correct) {
        // jawaban benar — tampilkan penjelasan lengkap
        setIsSolved(true);
        setShowSolution(true);
        setHint(null);
        if (data.explanation) setExplanation(data.explanation);
        setCanAdvance(true);
        if (onComplete) onComplete();
      } else {
        // jawaban salah — terima petunjuk bertahap
        const nextAttempt = attempts + 1;
        setAttempts(nextAttempt);
        if (data.hint) setHint(data.hint);
        if (data.showSolution) {
          setShowSolution(true);
          if (data.explanation) setExplanation(data.explanation);
        }
      }
    } catch (e) {
      setHint('Maaf, layanan tidak tersedia. Coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
      {/* Card header */}
      <div className="border-b border-neutral-100 bg-primary-50 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500">
          Tantangan Numerasi
        </p>
        <h3 className="mt-1 text-lg font-black text-neutral-900">Misi Kubus</h3>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Soal */}
        <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
          <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
            Jika panjang rusuk kubus pada bagian alas Candi Jawi adalah{' '}
            <span className="font-black text-primary-700">8 cm</span>, berapakah volumenya?
          </p>
        </div>

        {/* Submit + hint area */}
        <div className="px-5 pb-5">
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => void handleSubmitAnswer()}
              disabled={!selected || isSolved || isSubmitting}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
            </button>
            <button
              type="button"
              onClick={() => {
                // allow student to reveal full solution only after 3 attempts
                setShowSolution(true);
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              Tunjukkan Pembahasan
            </button>
          </div>

          {/* Hint / explanation box */}
          <div className="mt-3">
            {hint && (
              <div className="rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
                {hint}
              </div>
            )}

            {showSolution && explanation && (
              <div className="mt-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
                <pre className="whitespace-pre-wrap text-sm">{explanation}</pre>
              </div>
            )}
          </div>
        </div>

        {/* SVG illustration */}
        <div className="flex justify-center py-2">
          <KubusSvg />
        </div>

        {/* Answer options */}
        <div className="flex flex-col gap-3">
          {OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={[
                'flex min-h-[52px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.98]',
                selected === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black',
                  selected === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600',
                ].join(' ')}
              >
                {key}
              </span>
              <span
                className={[
                  'text-base font-bold',
                  selected === key ? 'text-primary-700' : 'text-neutral-800',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ResolutionCover ──────────────────────────────────────────────────────────

interface ResolutionCoverProps {
  comic: { title: string; lokasi: string; kelas: string; cover: string };
  onStart: () => void;
}

function ResolutionCover({ comic, onStart }: ResolutionCoverProps) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero image */}
      <div className="-mx-3 sm:mx-0">
        <div className="relative overflow-hidden sm:rounded-[24px]" style={{ aspectRatio: '16/9' }}>
          <Image
            src={comic.cover}
            alt={`Cover ${comic.title}`}
            fill
            className="object-cover object-top"
            priority
            sizes="(max-width: 640px) 100vw, 672px"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-800/40 to-transparent" />

          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end px-5 pb-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-3xl">🏛️</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl">
              RESOLUTION
            </h1>
            <p className="mt-1 text-base font-black text-secondary-300 drop-shadow sm:text-lg">
              Misi Bangun Ruang
            </p>
          </div>
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
          Sekarang saatnya menggunakan pengetahuanmu untuk menyelesaikan tantangan matematika
          berdasarkan bagian-bagian Candi Jawi.
        </p>
      </div>

      {/* What you will do */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-black text-neutral-700">🎯 Yang Akan Kamu Lakukan</h3>
        </div>
        <ul className="flex flex-col gap-3 px-5 py-4">
          {[
            { emoji: '🔍', text: 'Membaca soal tantangan berdasarkan bagian Candi Jawi.' },
            { emoji: '🧮', text: 'Menghitung menggunakan rumus bangun ruang yang sudah kamu pelajari.' },
            { emoji: '✅', text: 'Menyelesaikan misi dan melanjutkan perjalanan belajarmu.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-primary-50 p-3 sm:p-4">
              <span className="flex-shrink-0 text-xl">{item.emoji}</span>
              <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[20px] bg-primary-600 px-6 py-4 text-base font-black text-white shadow-[0_4px_16px_rgba(24,117,204,0.35)] transition hover:bg-primary-700 active:scale-[0.98]"
      >
        <span>🚀</span>
        Mulai Misi
      </button>

    </div>
  );
}
