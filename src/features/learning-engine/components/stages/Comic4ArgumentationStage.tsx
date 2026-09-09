'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RobotMascot from '@/components/ai/RobotMascot';

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface Comic4Option {
  label: string;
  value: string;
  correct?: boolean;
}

export interface Comic4ArgumentationQuestion {
  id: string;
  templePart: string;
  context?: string;
  question: string;
  answerType?: 'text' | 'choice';
  options?: Comic4Option[];
  expectedAnswer?: string;
  expectedKeywords?: string[];
  partialKeywords?: string[];
  explanation?: string;
}

interface Comic4Feedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
  explanation?: string;
}

interface Comic4ArgumentationStageProps {
  question: Comic4ArgumentationQuestion;
  onSubmitFeedback: (feedback: Comic4Feedback) => void;
  onAnswerChange: (value: string) => void;
  onNext: () => void | Promise<void>;
  isAdvancing: boolean;
  feedback: Comic4Feedback | null;
  currentIndex: number;
  totalItems: number;
  initialAnswer?: string;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[.,]/g, '').trim();
}

function evaluateAnswer(question: Comic4ArgumentationQuestion, answer: string): Comic4Feedback {
  const normalizedAnswer = normalize(answer);
  const expectedKeywords = question.expectedKeywords ?? [];
  const partialKeywords = question.partialKeywords ?? [];
  const isCorrectChoice = question.answerType === 'choice'
    ? answer === question.options?.find((option) => option.correct)?.value
    : expectedKeywords.length > 0 && expectedKeywords.every((keyword) => normalizedAnswer.includes(normalize(keyword)));
  const isPartiallyCorrect = question.answerType === 'choice'
    ? answer.length > 0
    : partialKeywords.some((keyword) => normalizedAnswer.includes(normalize(keyword)));

  if (isCorrectChoice) {
    return {
      level: 'SANGAT_BAIK',
      score: 5,
      feedback: 'Benar! Alasanmu tepat dan sesuai dengan materi Komik 4.',
      explanation: question.explanation,
    };
  }

  if (isPartiallyCorrect) {
    return {
      level: 'HAMPIR_BENAR',
      score: 3,
      feedback: 'Jawabanmu sudah mendekati. Perhatikan kembali hubungan antar data dan alasan yang diminta dalam pertanyaan.',
      explanation: question.explanation,
    };
  }

  return {
    level: 'PERLU_PERBAIKAN',
    score: 1,
    feedback: 'Belum tepat. Coba perhatikan kembali konteks Komik 4, lalu gunakan data yang tersedia untuk menjelaskan jawabanmu.',
    explanation: question.explanation,
  };
}

function FeedbackCard({ feedback }: { feedback: Comic4Feedback }) {
  const details = {
    SANGAT_BAIK: { label: 'Benar', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    HAMPIR_BENAR: { label: 'Sebagian benar', color: 'border-amber-200 bg-amber-50 text-amber-800' },
    PERLU_PERBAIKAN: { label: 'Belum tepat', color: 'border-sky-200 bg-sky-50 text-sky-800' },
  }[feedback.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[24px] border p-5 ${details.color}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{details.label}</p>
        <p className="text-sm font-black">{feedback.score}/5</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{feedback.feedback}</p>
      {feedback.explanation ? (
        <div className="mt-4 border-t border-current/15 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em]">Penjelasan</p>
          <p className="mt-2 text-sm leading-relaxed">{feedback.explanation}</p>
        </div>
      ) : null}
    </motion.div>
  );
}

export default function Comic4ArgumentationStage({
  question,
  onSubmitFeedback,
  onAnswerChange,
  onNext,
  isAdvancing,
  feedback,
  currentIndex,
  totalItems,
  initialAnswer = '',
}: Comic4ArgumentationStageProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const isChoice = question.answerType === 'choice';
  const canSubmit = answer.trim().length > 0 && !feedback;

  useEffect(() => {
    setAnswer(initialAnswer);
  }, [initialAnswer, question.id]);

  const updateAnswer = (value: string) => {
    setAnswer(value);
    onAnswerChange(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_-30px_rgba(15,23,42,0.25)]">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Judul Stage</p>
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-neutral-900">ARGUMENTATION</h2>
            <p className="text-sm font-semibold text-accent-700">Argumentasi {currentIndex + 1} dari {totalItems}</p>
          </div>

          {question.context ? (
            <div className="rounded-[24px] border border-primary-100 bg-primary-50/70 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary-700">Konteks Komik 4</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-800">{question.context}</p>
            </div>
          ) : null}

          <div className="rounded-[24px] bg-neutral-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500">Pertanyaan</p>
            <p className="mt-3 text-base font-semibold leading-relaxed text-neutral-900">{question.question}</p>
          </div>

          <div className="rounded-[20px] border border-primary-100 bg-primary-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                <RobotMascot variant="inline" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary-700">Petunjuk</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-800">Gunakan data pada konteks untuk menjelaskan alasanmu.</p>
              </div>
            </div>
          </div>

          {isChoice && question.options ? (
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Pilih jawaban</legend>
              {question.options.map((option) => (
                <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-[18px] border p-4 transition ${answer === option.value ? 'border-accent-500 bg-accent-50' : 'border-neutral-200 bg-white'}`}>
                  <input
                    type="radio"
                    name={`comic4-argumentation-${question.id}`}
                    value={option.value}
                    checked={answer === option.value}
                    disabled={Boolean(feedback)}
                    onChange={(event) => updateAnswer(event.target.value)}
                    className="mt-1 accent-[var(--color-accent-600)]"
                  />
                  <span className="text-sm leading-relaxed text-neutral-800">{option.value}. {option.label}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div>
              <label htmlFor={`comic4-arg-answer-${question.id}`} className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Jawabanmu</label>
              <textarea
                id={`comic4-arg-answer-${question.id}`}
                value={answer}
                disabled={Boolean(feedback)}
                onChange={(event) => updateAnswer(event.target.value)}
                placeholder="Tuliskan alasanmu di sini..."
                className="mt-3 min-h-[150px] w-full resize-y rounded-[24px] border border-neutral-200 bg-white px-4 py-4 text-sm leading-relaxed text-neutral-900 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 disabled:bg-neutral-50"
              />
            </div>
          )}

          {!feedback ? (
            <button
              type="button"
              onClick={() => onSubmitFeedback(evaluateAnswer(question, answer))}
              disabled={!canSubmit}
              className="w-full rounded-[20px] bg-accent-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Kirim jawaban
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div className="space-y-4">
          <FeedbackCard feedback={feedback} />
          <button
            type="button"
            onClick={() => void onNext()}
            disabled={isAdvancing}
            className="relative z-10 w-full rounded-[24px] bg-accent-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdvancing ? 'Menyimpan...' : 'Lanjut'}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}