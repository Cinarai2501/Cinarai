'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import {
  getArgumentationQuestions,
  type ArgumentationQuestion,
} from '../../stages/Argumentation/data/argumentationQuestions';

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
}

interface QuestionAnswer {
  questionId: string;
  question: string;
  templePart: string;
  shapeName: string;
  studentAnswer: string;
  aiFeedback: AiFeedback | null;
  timestamp: number | null;
}

// ─── Inline shape SVGs (covers limas & prisma not in /navigation/) ────────────

/* eslint-disable @next/next/no-img-element */
function ShapeIcon({ shapeKey, shapeSrc, shapeName, className }: { shapeKey: string; shapeSrc: string; shapeName: string; className?: string }) {
  if (shapeKey === 'limas') {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-label={shapeName}>
        <polygon points="40,8 72,68 8,68" fill="none" stroke="#1875cc" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="40" y1="8" x2="56" y2="44" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="8" y1="68" x2="56" y2="44" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="72" y1="68" x2="56" y2="44" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4,3" />
        <ellipse cx="40" cy="68" rx="32" ry="6" fill="none" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4,3" />
      </svg>
    );
  }
  if (shapeKey === 'prisma') {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-label={shapeName}>
        <polygon points="40,10 68,60 12,60" fill="none" stroke="#1875cc" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="52,22 80,72 24,72" fill="none" stroke="#1875cc" strokeWidth="2" strokeLinejoin="round" />
        <line x1="40" y1="10" x2="52" y2="22" stroke="#1875cc" strokeWidth="1.5" />
        <line x1="68" y1="60" x2="80" y2="72" stroke="#1875cc" strokeWidth="1.5" />
        <line x1="12" y1="60" x2="24" y2="72" stroke="#1875cc" strokeWidth="1.5" />
      </svg>
    );
  }
  return <img src={shapeSrc} alt={shapeName} className={className} />;
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Skor ${score} dari 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={['h-5 w-5', i < score ? 'text-secondary-400' : 'text-neutral-200'].join(' ')}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── DynamicCover ─────────────────────────────────────────────────────────────

function DynamicCover({ question }: { question: ArgumentationQuestion }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-sm">
      {/* Photo — real Candi Jawi photo with highlight outline */}
      <div className={['relative overflow-hidden rounded-t-[20px] border-b-2 border-transparent bg-white', question.highlightColor].join(' ')}>
        <img
          src={question.photoSrc}
          alt={question.photoAlt}
          className="h-[260px] w-full object-cover sm:h-[320px]"
        />
        {question.overlaySrc && (
          <img
            src={question.overlaySrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen pointer-events-none"
          />
        )}
        {/* Part label badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 shadow-sm">
          <span className="text-xs font-bold text-neutral-700">📷</span>
          <span className="text-xs font-bold capitalize text-neutral-700">{question.templePart}</span>
        </div>
      </div>

      {/* Arrow connector */}
      <div className="flex flex-col items-center gap-1 bg-white py-4">
        <div className="h-6 w-0.5 rounded-full bg-neutral-300" />
        <svg viewBox="0 0 16 10" className="h-4 w-5 text-neutral-400" fill="currentColor" aria-hidden="true">
          <path d="M8 10L0 0h16z" />
        </svg>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          dimodelkan sebagai
        </p>
      </div>

      {/* Shape model */}
      <div className="flex items-center justify-center bg-white pb-6 pt-2">
        <div className="flex flex-col items-center gap-3">
          <div className={['relative flex h-[148px] w-[148px] items-center justify-center rounded-[32px] border-2 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]', question.highlightColor].join(' ')}>
            <div className="flex h-[116px] w-[116px] items-center justify-center rounded-3xl bg-neutral-50 p-4">
              <ShapeIcon
                shapeKey={question.shapeKey}
                shapeSrc={question.shapeSrc}
                shapeName={question.shapeName}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <span className="text-sm font-black text-neutral-900">{question.shapeName}</span>
        </div>
      </div>
    </div>
  );
}

// ─── AiFeedbackCard ───────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<FeedbackLevel, { emoji: string; label: string }> = {
  SANGAT_BAIK:      { emoji: '✅', label: 'Sangat Baik' },
  HAMPIR_BENAR:     { emoji: '🟡', label: 'Hampir Benar' },
  PERLU_PERBAIKAN:  { emoji: '🔴', label: 'Perlu Perbaikan' },
};

function AiFeedbackCard({ feedback, studentAnswer }: { feedback: AiFeedback; studentAnswer: string }) {
  const badge = LEVEL_BADGE[feedback.level] ?? LEVEL_BADGE.HAMPIR_BENAR;

  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-accent-200 bg-accent-50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-accent-100 bg-accent-100/60 px-4 py-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <img src="/images/ai/robot.svg" alt="AI Evaluator" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent-700">
            Umpan Balik AI
          </p>
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-neutral-700 shadow-sm">
            {badge.emoji} {badge.label}
          </span>
        </div>
        <StarRating score={feedback.score} />
      </div>

      {/* Student answer quote */}
      <div className="border-b border-accent-100 bg-white/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Jawabanmu</p>
        <p className="mt-1 text-sm italic leading-relaxed text-neutral-600">
          &ldquo;{studentAnswer}&rdquo;
        </p>
      </div>

      {/* Feedback body */}
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-neutral-800">{feedback.feedback}</p>
      </div>

      {/* Score rubric */}
      <div className="border-t border-accent-100 px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Skor Penilaian
        </p>
        <div className="flex items-center justify-between gap-3">
          <StarRating score={feedback.score} />
          <span className="text-sm font-black text-accent-700">{feedback.score} / 5</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Ketepatan konsep', 'Alasan logis', 'Istilah matematika'].map((label) => (
            <span
              key={label}
              className="rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-bold text-accent-700"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ArgumentationStage ───────────────────────────────────────────────────────

export default function ArgumentationStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();

  const questions = useMemo(
    () => getArgumentationQuestions(comic.id, comic.lokasi, comic.cover),
    [comic.id, comic.lokasi, comic.cover],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>(() =>
    questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      templePart: q.templePart,
      shapeName: q.shapeName,
      studentAnswer: '',
      aiFeedback: null,
      timestamp: null,
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex]!;
  const currentAnswer = answers[currentIndex]!;
  const allAnswered = answers.every((a) => a.aiFeedback !== null);
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentHasFeedback = currentAnswer.aiFeedback !== null;
  const charCount = currentAnswer.studentAnswer.trim().length;
  const canSubmit = charCount >= 20 && !isSubmitting && !currentHasFeedback;

  useEffect(() => {
    setCanAdvance(allAnswered);
  }, [allAnswered, setCanAdvance]);

  const handleAnswerChange = useCallback(
    (text: string) => {
      setAnswers((prev) =>
        prev.map((a, i) => (i === currentIndex ? { ...a, studentAnswer: text } : a)),
      );
    },
    [currentIndex],
  );

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ai/argumentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          studentAnswer: currentAnswer.studentAnswer,
          shapeName: currentQuestion.shapeName,
          templePart: currentQuestion.templePart,
          comicTitle: comic.title,
          lokasi: comic.lokasi,
          classLevel: comic.kelas,
        }),
      });

      const data = (await res.json()) as {
        level?: FeedbackLevel;
        score?: number;
        feedback?: string;
        error?: string;
      };

      const feedback: AiFeedback = {
        level: data.level ?? 'HAMPIR_BENAR',
        score: Math.min(5, Math.max(1, Number(data.score) || 3)),
        feedback: data.feedback ?? 'Terima kasih atas jawabanmu!',
      };

      setAnswers((prev) =>
        prev.map((a, i) =>
          i === currentIndex ? { ...a, aiFeedback: feedback, timestamp: Date.now() } : a,
        ),
      );
    } catch {
      setAnswers((prev) =>
        prev.map((a, i) =>
          i === currentIndex
            ? {
                ...a,
                aiFeedback: {
                  level: 'HAMPIR_BENAR',
                  score: 3,
                  feedback:
                    'Maaf, layanan AI sedang tidak tersedia. Lanjutkan ke pertanyaan berikutnya.',
                },
                timestamp: Date.now(),
              }
            : a,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, currentAnswer, currentQuestion, comic, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions.length]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* ── Stage header — orange gradient per blueprint ── */}
      <header className="rounded-[24px] bg-gradient-to-br from-secondary-400 to-secondary-600 px-4 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-sm">
            <span className="text-lg font-black text-white">5</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
              Argumentation
            </p>
            <h2 className="mt-0.5 text-base font-black leading-snug text-white sm:text-lg">
              Jelaskan alasanmu berdasarkan hasil pengamatan pada tahap sebelumnya.
            </h2>
          </div>
        </div>
      </header>

      {/* ── Progress dots ── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-neutral-400">
          Pertanyaan {currentIndex + 1} dari {questions.length}
        </span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={[
                'h-2 rounded-full transition-all duration-300',
                i < currentIndex
                  ? 'w-4 bg-accent-400'
                  : i === currentIndex
                    ? 'w-7 bg-secondary-500'
                    : 'w-4 bg-neutral-200',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* ── Question card — shown FIRST per blueprint ── */}
      <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-600">
          💬 Pertanyaan Argumentasi
        </p>
        <p className="mt-2 text-base font-black leading-snug text-neutral-900 sm:text-lg">
          {currentQuestion.question}
        </p>
      </div>

      {/* ── Dynamic cover: photo → arrow → shape ── */}
      <DynamicCover key={currentQuestion.id} question={currentQuestion} />

      {/* ── Answer input (hidden after feedback) ── */}
      {!currentHasFeedback && (
        <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
          <label htmlFor="argumentation-answer" className="mb-2 block text-sm font-black text-neutral-700">
            ✏️ Tuliskan Alasanmu
          </label>
          <textarea
            id="argumentation-answer"
            value={currentAnswer.studentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            rows={5}
            placeholder="Tuliskan alasanmu di sini..."
            disabled={isSubmitting}
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-secondary-400 focus:bg-white focus:ring-2 focus:ring-secondary-100 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={[
                'text-xs font-semibold',
                charCount < 20 ? 'text-warning-600' : 'text-accent-600',
              ].join(' ')}
            >
              {charCount < 20
                ? `Minimal 20 karakter (${charCount}/20)`
                : `${charCount} karakter ✓`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-secondary-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-secondary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                AI sedang menganalisis alasanmu...
              </>
            ) : (
              'Kirim Jawaban'
            )}
          </button>
        </div>
      )}

      {/* ── AI Feedback card — always green per blueprint ── */}
      {currentHasFeedback && currentAnswer.aiFeedback && (
        <AiFeedbackCard
          feedback={currentAnswer.aiFeedback}
          studentAnswer={currentAnswer.studentAnswer}
        />
      )}

      {/* ── Navigation after feedback ── */}
      {currentHasFeedback && (
        <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-secondary-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-secondary-600 active:scale-[0.98]"
            >
              Pertanyaan Berikutnya →
            </button>
          ) : allAnswered ? (
            <button
              type="button"
              onClick={() => void nextStage()}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700 active:scale-[0.98]"
            >
              🎉 Lanjut ke Resolution →
            </button>
          ) : null}
        </div>
      )}

      {/* ── Summary when all done ── */}
      {allAnswered && isLastQuestion && (
        <div className="space-y-4">
          <div className="rounded-[20px] border-2 border-accent-200 bg-accent-50 px-4 py-4">
            <p className="text-center text-sm font-black text-accent-700">✅ Semua pertanyaan selesai!</p>
            <p className="mt-1 text-center text-xs text-accent-600">
              Rata-rata skor:{' '}
              <span className="font-black">
                {(
                  answers.reduce((sum, a) => sum + (a.aiFeedback?.score ?? 0), 0) / answers.length
                ).toFixed(1)}{' '}
                / 5
              </span>
            </p>
          </div>

          {/* Tantangan Numerasi (UI saja, belum ada validasi) */}
          <NumeracyChallenge />
        </div>
      )}
    </div>
  );
}

// ─── NumeracyChallenge (UI only) ───────────────────────────────────────────
function NumeracyChallenge() {
  const OPTIONS = [
    { key: 'A', label: '256 cm³' },
    { key: 'B', label: '384 cm³' },
    { key: 'C', label: '512 cm³' },
    { key: 'D', label: '640 cm³' },
  ];
  const [selected, setSelected] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!showSimulation) return;
    setShowResult(false);
    const timer = setTimeout(() => setShowResult(true), 2600);
    return () => clearTimeout(timer);
  }, [showSimulation]);
  // AI Tutor panel state
  const [tutorMessage, setTutorMessage] = useState<string | null>(null);
  const [tutorVariant, setTutorVariant] = useState<'positive' | 'constructive' | null>(null);

  useEffect(() => {
    if (!selected) {
      setTutorMessage(null);
      setTutorVariant(null);
      return;
    }

    // Deterministic feedback (no external AI)
    if (selected === 'C') {
      setTutorVariant('positive');
      setTutorMessage([
        'Kamu berhasil menerapkan rumus volume kubus dengan benar.',
        '',
        'Rumus Volume Kubus = s × s × s',
        'Dengan s = 8 cm:',
        '8 × 8 × 8 = 512 cm³',
        '',
        'Kenapa bagian alas Candi Jawi dapat dimodelkan sebagai kubus di pembelajaran ini?',
        'Karena bagian alas yang dimaksud berbentuk persegi (panjang dan lebar sama). Jika kita membayangkan tinggi yang sama dengan panjang rusuk alas, bentuk idealnya adalah kubus — sehingga volume dihitung dengan mengalikan panjang × lebar × tinggi (s × s × s).',
      ].join('\n'));
    } else {
      setTutorVariant('constructive');
      setTutorMessage([
        'Baik, mari periksa langkah perhitungannya bersama-sama.',
        '',
        'Konsep penting: Volume kubus = panjang × lebar × tinggi. Untuk kubus semua sisi sama, jadi Volume = s × s × s.',
        'Dengan s = 8 cm, lakukan langkah berturut-turut:',
        '1) 8 × 8 = 64',
        '2) 64 × 8 = 512 cm³',
        '',
        'Perhatikan langkah perkalian berulang di atas — pilihan jawaban biasanya berbeda ketika langkah ketiga tidak dihitung atau dikalikan dengan angka lain. Coba hitung kembali langkah-langkahnya dan bandingkan dengan pilihan yang tersedia.',
      ].join('\n'));
    }
  }, [selected]);

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
      <div className="border-b border-neutral-100 bg-primary-50 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500">Tantangan Numerasi</p>
        <h3 className="mt-1 text-lg font-black text-neutral-900">Misi Kubus</h3>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
          <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
            Jika panjang rusuk kubus pada bagian alas Candi Jawi adalah{' '}
            <span className="font-black text-primary-700">8 cm</span>, berapakah volumenya?
          </p>
        </div>

        {/* Simple SVG cube illustration */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 120 100" className="w-full max-w-[160px]" aria-hidden="true">
            <rect x="20" y="30" width="60" height="60" fill="#e0f0ff" stroke="#1875cc" strokeWidth="2" />
            <polygon points="20,30 40,10 100,10 80,30" fill="#c1e1ff" stroke="#1875cc" strokeWidth="2" />
            <polygon points="80,30 100,10 100,70 80,90" fill="#a1d2ff" stroke="#1875cc" strokeWidth="2" />
            <line x1="20" y1="30" x2="40" y2="10" stroke="#1875cc" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="60" y="95" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1875cc">s = 8 cm</text>
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                'flex min-h-[52px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.98]',
                selected === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50',
              ].join(' ')}
            >
              <span className={['flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black', selected === key ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'].join(' ')}>
                {key}
              </span>
              <span className={['text-base font-bold', selected === key ? 'text-primary-700' : 'text-neutral-800'].join(' ')}>{label}</span>
            </button>
          ))}
        </div>
        {/* Controls: show animation when student has answered */}
        <div className="px-5 pb-5">
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowSimulation(true)}
              disabled={!selected}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-secondary-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-secondary-600 disabled:opacity-50"
            >
              Tampilkan Animasi
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSimulation(false);
                setShowResult(false);
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              Reset Animasi
            </button>
          </div>

          {/* Simulation area */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="w-full max-w-[240px]">
              <svg viewBox="0 0 120 100" className="w-full" aria-hidden="true">
                {/* cube outlines (transparent faces) */}
                <rect x="20" y="30" width="60" height="60" fill="none" stroke="#1875cc" strokeWidth="2" fillOpacity="0.12" />
                <polygon points="20,30 40,10 100,10 80,30" fill="none" stroke="#1875cc" strokeWidth="2" fillOpacity="0.08" />
                <polygon points="80,30 100,10 100,70 80,90" fill="none" stroke="#1875cc" strokeWidth="2" fillOpacity="0.08" />

                {/* edge label */}
                <text x="60" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1875cc">s = 8 cm</text>

                {/* fill front face (rect) — animate scaleY */}
                <g transform="translate(20,30)">
                  <rect
                    x="0"
                    y="0"
                    width="60"
                    height="60"
                    fill="#1875cc"
                    opacity="0.14"
                  />
                  <rect
                    x="0"
                    y="0"
                    width="60"
                    height="60"
                    fill="#1875cc"
                    style={{ transformOrigin: 'bottom', transform: showSimulation ? 'scaleY(1)' : 'scaleY(0)', transition: 'transform 2.5s linear' }}
                    opacity="0.28"
                  />
                </g>

                {/* simple top face fill — clipped via scale */}
                <g transform="translate(0,0)">
                  <polygon
                    points="20,30 40,10 100,10 80,30"
                    fill="#1875cc"
                    opacity="0.08"
                    style={{ transformOrigin: 'center bottom', transform: showSimulation ? 'scaleY(1)' : 'scaleY(0)', transition: 'transform 2.5s linear' }}
                  />
                </g>

                {/* right face fill */}
                <g>
                  <polygon
                    points="80,30 100,10 100,70 80,90"
                    fill="#1875cc"
                    opacity="0.06"
                    style={{ transformOrigin: 'left bottom', transform: showSimulation ? 'scaleY(1)' : 'scaleY(0)', transition: 'transform 2.5s linear' }}
                  />
                </g>
              </svg>
            </div>

            {/* Explanation after animation */}
            <div className="w-full max-w-[360px]">
              {showSimulation && (
                <p className="text-sm text-neutral-700">Mengisi kubus untuk menunjukkan Volume = panjang × lebar × tinggi</p>
              )}
              {showResult && (
                <div className="mt-2 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
                  <p className="font-black">Mengapa volume 512 cm³?</p>
                  <p>Rumus Volume Kubus = s × s × s</p>
                  <p className="mt-1">8 × 8 × 8 = 512 cm³</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Tutor Panel */}
          {tutorMessage && (
            <div className={[
              'mt-4 overflow-hidden rounded-2xl border px-4 py-3',
              tutorVariant === 'positive' ? 'border-accent-200 bg-accent-50' : 'border-neutral-100 bg-white',
            ].join(' ')}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <img src="/images/ai/robot.svg" alt="AI Tutor" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-neutral-800">
                    {tutorVariant === 'positive' ? 'AI Tutor — Apresiasi' : 'AI Tutor — Bantuan'}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{tutorMessage}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
