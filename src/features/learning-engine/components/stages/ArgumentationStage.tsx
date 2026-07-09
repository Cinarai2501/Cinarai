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
  studentAnswer: string;
  aiFeedback: AiFeedback | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<FeedbackLevel, { emoji: string; label: string; cardClass: string; labelClass: string }> = {
  SANGAT_BAIK: {
    emoji: '✅',
    label: 'Sangat Baik',
    cardClass: 'border-accent-200 bg-accent-50',
    labelClass: 'text-accent-700 bg-accent-100',
  },
  HAMPIR_BENAR: {
    emoji: '🟡',
    label: 'Hampir Benar',
    cardClass: 'border-warning-200 bg-warning-50',
    labelClass: 'text-warning-700 bg-warning-100',
  },
  PERLU_PERBAIKAN: {
    emoji: '🔴',
    label: 'Perlu Perbaikan',
    cardClass: 'border-error-200 bg-error-50',
    labelClass: 'text-error-700 bg-error-100',
  },
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Skor ${score} dari 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={['h-4 w-4', i < score ? 'text-secondary-400' : 'text-neutral-200'].join(' ')}
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

/* eslint-disable @next/next/no-img-element */
function DynamicCover({ question }: { question: ArgumentationQuestion }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-neutral-100 bg-white shadow-sm">
      <div className="relative">
        {/* Photo */}
        <div className={['relative overflow-hidden border-2', question.highlightColor].join(' ')}>
          <img
            src={question.photoSrc}
            alt={question.photoAlt}
            className="h-44 w-full object-cover sm:h-52"
          />
          {/* SVG overlay highlight */}
          {question.overlaySrc && (
            <img
              src={question.overlaySrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          )}
          {/* Photo label */}
          <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            📷 {question.photoAlt}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center bg-neutral-50 py-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-5 w-0.5 bg-neutral-300" />
            <svg viewBox="0 0 12 8" className="h-3 w-3 text-neutral-400" fill="currentColor">
              <path d="M6 8L0 0h12z" />
            </svg>
          </div>
        </div>

        {/* Shape model */}
        <div className="flex items-center justify-center gap-4 bg-neutral-50 px-4 pb-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary-100 bg-white shadow-sm">
              <img
                src={question.shapeSrc}
                alt={`Model ${question.shapeName}`}
                className="h-14 w-14 object-contain"
              />
            </div>
            <span className="text-xs font-black text-primary-700">{question.shapeName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: ArgumentationQuestion;
  index: number;
  total: number;
  answer: QuestionAnswer;
  onAnswerChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function QuestionCard({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
}: QuestionCardProps) {
  const hasFeedback = answer.aiFeedback !== null;
  const charCount = answer.studentAnswer.trim().length;
  const canSubmit = charCount >= 20 && !isSubmitting && !hasFeedback;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-neutral-400">
          Pertanyaan {index + 1} dari {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-all',
                i < index
                  ? 'w-4 bg-accent-400'
                  : i === index
                    ? 'w-6 bg-primary-500'
                    : 'w-4 bg-neutral-200',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Dynamic cover */}
      <DynamicCover question={question} />

      {/* Question */}
      <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary-600">
          Pertanyaan Argumentasi
        </p>
        <p className="mt-2 text-base font-black leading-snug text-neutral-900 sm:text-lg">
          {question.question}
        </p>
      </div>

      {/* Answer input */}
      {!hasFeedback && (
        <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
          <label className="mb-2 block text-sm font-black text-neutral-700">
            ✏️ Tuliskan Alasanmu
          </label>
          <textarea
            value={answer.studentAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            rows={5}
            placeholder="Tuliskan alasanmu di sini..."
            disabled={isSubmitting}
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={[
                'text-xs font-semibold',
                charCount < 20 ? 'text-warning-600' : 'text-accent-600',
              ].join(' ')}
            >
              {charCount < 20 ? `Minimal 20 karakter (${charCount}/20)` : `${charCount} karakter ✓`}
            </span>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"
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

      {/* AI Feedback */}
      {hasFeedback && answer.aiFeedback && (
        <AiFeedbackCard feedback={answer.aiFeedback} studentAnswer={answer.studentAnswer} />
      )}
    </div>
  );
}

// ─── AiFeedbackCard ───────────────────────────────────────────────────────────

function AiFeedbackCard({
  feedback,
  studentAnswer,
}: {
  feedback: AiFeedback;
  studentAnswer: string;
}) {
  const cfg = LEVEL_CONFIG[feedback.level] ?? LEVEL_CONFIG.HAMPIR_BENAR;

  return (
    <div className={['overflow-hidden rounded-[20px] border-2 shadow-sm', cfg.cardClass].join(' ')}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-100/60 px-4 py-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <img src="/images/ai/robot.svg" alt="AI" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Umpan Balik AI
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={['rounded-full px-2 py-0.5 text-xs font-black', cfg.labelClass].join(' ')}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        </div>
        <StarRating score={feedback.score} />
      </div>

      {/* Jawaban siswa */}
      <div className="border-b border-neutral-100/60 bg-white/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Jawabanmu
        </p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-700 italic">
          &ldquo;{studentAnswer}&rdquo;
        </p>
      </div>

      {/* Feedback text */}
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-neutral-800">{feedback.feedback}</p>
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
    questions.map((q) => ({ questionId: q.id, studentAnswer: '', aiFeedback: null })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex]!;
  const currentAnswer = answers[currentIndex]!;

  // All questions answered → unlock advance
  const allAnswered = answers.every((a) => a.aiFeedback !== null);
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentHasFeedback = currentAnswer.aiFeedback !== null;

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
    if (isSubmitting || currentAnswer.studentAnswer.trim().length < 20) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ai/argumentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          studentAnswer: currentAnswer.studentAnswer,
          shapeName: currentQuestion.shapeName,
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
        score: data.score ?? 3,
        feedback: data.feedback ?? 'Terima kasih atas jawabanmu!',
      };

      setAnswers((prev) =>
        prev.map((a, i) => (i === currentIndex ? { ...a, aiFeedback: feedback } : a)),
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
                  feedback: 'Maaf, layanan AI sedang tidak tersedia. Lanjutkan ke pertanyaan berikutnya.',
                },
              }
            : a,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, currentAnswer, currentQuestion, comic, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, questions.length]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Stage header */}
      <header className="rounded-[24px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
            <span className="text-xs font-black">5</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-600">
              Argumentation
            </p>
            <p className="mt-0.5 text-sm leading-snug text-neutral-600">
              Jelaskan alasanmu berdasarkan hasil pengamatan pada model 3D.
            </p>
          </div>
        </div>
      </header>

      {/* Question card */}
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        index={currentIndex}
        total={questions.length}
        answer={currentAnswer}
        onAnswerChange={handleAnswerChange}
        onSubmit={() => void handleSubmit()}
        isSubmitting={isSubmitting}
      />

      {/* Next question / Lanjut ke Resolution */}
      {currentHasFeedback && (
        <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
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

      {/* Summary when all done */}
      {allAnswered && isLastQuestion && (
        <div className="rounded-[20px] border border-accent-200 bg-accent-50 px-4 py-4">
          <p className="text-center text-sm font-black text-accent-700">
            ✅ Semua pertanyaan selesai! Rata-rata skor:{' '}
            {(
              answers.reduce((sum, a) => sum + (a.aiFeedback?.score ?? 0), 0) / answers.length
            ).toFixed(1)}{' '}
            / 5
          </p>
        </div>
      )}
    </div>
  );
}
