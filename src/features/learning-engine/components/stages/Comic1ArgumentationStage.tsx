'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Comic1ArgumentationQuestion } from '@/features/comics/comic-1/content/types';

/* eslint-disable @next/next/no-img-element */

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
  strength?: string;
  improvement?: string;
  suggestion?: string;
}

interface Comic1ArgumentationStageProps {
  question: Comic1ArgumentationQuestion;
  onSubmitFeedback: (feedback: AiFeedback, answer: string) => void;
  onNext: () => void;
  isSubmitting: boolean;
  feedback: AiFeedback | null;
  comicTitle: string;
  comicLocation: string;
  classLevel: string;
}

function FeedbackCard({ feedback, studentAnswer }: { feedback: AiFeedback; studentAnswer: string }) {
  const levelBadge = {
    SANGAT_BAIK: { emoji: '⭐', label: 'Sangat Baik', color: 'bg-emerald-100 text-emerald-700' },
    HAMPIR_BENAR: { emoji: '📊', label: 'Hampir Benar', color: 'bg-amber-100 text-amber-700' },
    PERLU_PERBAIKAN: { emoji: '✏', label: 'Perlu Perbaikan', color: 'bg-sky-100 text-sky-700' },
  };

  const badge = levelBadge[feedback.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-sm"
    >
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${badge.color} text-lg font-bold`}>
            {badge.emoji}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500">Level</p>
            <p className="mt-0.5 text-sm font-bold text-neutral-900">{badge.label}</p>
          </div>
          <div className="ml-auto text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500">Skor</p>
            <p className="mt-0.5 text-2xl font-black text-accent-600">{feedback.score}/5</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500">✅ Kelebihan</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {feedback.strength || 'Jawaban Anda menunjukkan pemahaman yang baik.'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500">✏ Perbaikan</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {feedback.improvement || 'Perhatikan detail lebih lanjut untuk jawaban yang lebih sempurna.'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500">💡 Saran</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {feedback.suggestion || feedback.feedback || 'Terus tingkatkan pemahaman Anda dengan berlatih lebih banyak.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Comic1ArgumentationStage({
  question,
  onSubmitFeedback,
  onNext,
  isSubmitting,
  feedback,
  comicTitle,
  comicLocation,
  classLevel,
}: Comic1ArgumentationStageProps) {
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = answer.trim().length;
  const canSubmit = charCount >= 20 && !isSubmitting && !feedback;

  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    try {
      const response = await fetch('/api/ai/argumentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.argumentationQuestion,
          studentAnswer: answer,
          shapeName: question.shapeName,
          templePart: question.argumentationTitle,
          comicTitle,
          lokasi: comicLocation,
          classLevel,
        }),
      });

      const data = (await response.json()) as {
        feedback?: string;
        strength?: string;
        improvement?: string;
        suggestion?: string;
        level?: FeedbackLevel;
        score?: number;
      };

      onSubmitFeedback(
        {
          level: data.level ?? 'HAMPIR_BENAR',
          score: Math.min(5, Math.max(1, Number(data.score) || 4)),
          feedback: data.feedback ?? '',
          strength: data.strength,
          improvement: data.improvement,
          suggestion: data.suggestion,
        },
        answer
      );
    } catch (error) {
      console.error('Error submitting argumentation:', error);
      onSubmitFeedback(
        {
          level: 'HAMPIR_BENAR',
          score: 3,
          feedback: 'Terjadi kesalahan saat menganalisis jawaban. Silakan coba lagi.',
        },
        answer
      );
    }
  }, [answer, canSubmit, comicLocation, comicTitle, classLevel, question, onSubmitFeedback]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="rounded-[20px] bg-white p-4 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500">Judul Stage</p>
        <h2 className="mt-2 text-2xl font-black text-neutral-900">ARGUMENTATION</h2>
      </div>

      {/* Question */}
      <div className="rounded-[20px] bg-white p-4 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500">Pertanyaan</p>
        <p className="mt-3 text-base leading-relaxed text-neutral-900 font-semibold">
          {question.argumentationQuestion}
        </p>
      </div>

      {/* Image Layout: Photo + Arrow + Shape */}
      <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center gap-4 md:gap-6">
          {/* Photo */}
          <div className="w-full">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500 mb-3">
              Foto Bagian Candi
            </p>
            <div className="w-full overflow-hidden rounded-[16px] bg-neutral-100">
              <img
                src={question.argumentationPhoto}
                alt={question.photoAlt ?? 'Foto bagian candi'}
                className="h-auto w-full object-cover"
                style={{ maxHeight: 300 }}
              />
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" className="text-accent-600">
              <path
                d="M20 5v26M20 31l-7-7M20 31l7-7"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Shape Image */}
          <div className="w-full">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500 mb-3">
              Bangun Ruang: {question.shapeName}
            </p>
            <div className="w-full overflow-hidden rounded-[16px] bg-neutral-50 border border-neutral-100 p-6 flex items-center justify-center">
              {question.image ? (
                <img
                  src={question.image}
                  alt={`Ilustrasi ${question.shapeName}`}
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: 250 }}
                />
              ) : (
                <p className="text-sm text-neutral-500">Ilustrasi bangun ruang tidak tersedia.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Textarea */}
      {!feedback ? (
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <label htmlFor="comic1-arg-answer" className="block text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500 mb-3">
            Jawabanmu
          </label>
          <textarea
            id="comic1-arg-answer"
            ref={textareaRef}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              requestAnimationFrame(adjustTextareaHeight);
            }}
            placeholder="Tuliskan alasanmu di sini..."
            className="w-full resize-none rounded-[16px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 outline-none transition focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-200"
            style={{ minHeight: 150 }}
          />
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                charCount < 20 ? 'text-warning-600' : 'text-accent-600'
              }`}
            >
              {charCount < 20 ? `Minimal 20 karakter (${charCount}/20)` : `${charCount} karakter ✓`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="mt-4 w-full rounded-[16px] bg-accent-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sedang menganalisis...' : 'Kirim'}
          </button>
        </div>
      ) : (
        <>
          <FeedbackCard feedback={feedback} studentAnswer={answer} />
          <button
            type="button"
            onClick={() => void onNext()}
            className="w-full rounded-[16px] bg-accent-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700"
          >
            Lanjut
          </button>
        </>
      )}
    </motion.div>
  );
}
