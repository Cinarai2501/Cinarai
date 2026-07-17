'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import RobotMascot from '@/components/ai/RobotMascot';
import type { ArgumentationQuestion } from '@/features/learning-engine/stages/Argumentation/data/argumentationQuestions';

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
  strength?: string;
  improvement?: string;
  suggestion?: string;
}

interface Comic2ArgumentationStageProps {
  question: ArgumentationQuestion;
  onSubmitFeedback: (feedback: AiFeedback) => void;
  onAnswerChange: (value: string) => void;
  onNext: () => void;
  feedback: AiFeedback | null;
  comicTitle: string;
  comicLocation: string;
  classLevel: string;
  currentIndex: number;
  totalItems: number;
  initialAnswer?: string;
}

function FeedbackCard({ feedback }: { feedback: AiFeedback }) {
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
      className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
    >
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${badge.color} text-lg font-black`}>
            {badge.emoji}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Level</p>
            <p className="mt-1 text-sm font-black text-neutral-900">{badge.label}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Skor</p>
            <p className="mt-1 text-2xl font-black text-accent-600">{feedback.score}/5</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-neutral-100 pt-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">✅ Kelebihan</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{feedback.strength || 'Ulasan ini menyoroti bagian yang baik dari jawabanmu.'}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">✏ Hal yang perlu diperbaiki</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{feedback.improvement || 'Perkuat jawaban dengan alasan yang lebih jelas.'}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">💡 Saran</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{feedback.suggestion || feedback.feedback || 'Coba jelaskan hubungan antara objek candi dengan konsep simetri dengan lebih rinci.'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Comic2ArgumentationStage({
  question,
  onSubmitFeedback,
  onAnswerChange,
  onNext,
  feedback,
  comicTitle,
  comicLocation,
  classLevel,
  currentIndex,
  totalItems,
  initialAnswer = '',
}: Comic2ArgumentationStageProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutorMessage, setTutorMessage] = useState('');
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

  useEffect(() => {
    setAnswer(initialAnswer);
    // Build tutor message based on shape
    const defaultMessage = `Jelaskan mengapa ${question.templePart} pada ${comicLocation} dapat dimodelkan sebagai ${question.shapeName}.`;
    setTutorMessage(defaultMessage);
    setIsSubmitting(false);
  }, [initialAnswer, question, comicLocation]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai/argumentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          studentAnswer: answer,
          shapeName: question.shapeName,
          templePart: question.templePart,
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

      onSubmitFeedback({
        level: data.level ?? 'HAMPIR_BENAR',
        score: Math.min(5, Math.max(1, Number(data.score) || 4)),
        feedback: data.feedback ?? 'AI tidak memberikan umpan balik yang sesuai.',
        strength: data.strength,
        improvement: data.improvement,
        suggestion: data.suggestion,
      });
    } catch (error) {
      console.error('Error submitting argumentation:', error);
      // Fallback feedback jika AI gagal
      onSubmitFeedback({
        level: 'HAMPIR_BENAR',
        score: 3,
        feedback: 'Terima kasih telah memberikan alasan yang jelas.',
        strength: 'Jawaban sudah disampaikan dengan baik.',
        improvement: 'Coba tambahkan lebih banyak detail tentang bagian-bagian yang kamu lihat.',
        suggestion: 'Hubungkan bentuk yang kamu lihat dengan sifat-sifat bangun datar (seperti jumlah sisi atau sudut).',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, canSubmit, classLevel, comicLocation, comicTitle, onSubmitFeedback, question]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_-30px_rgba(15,23,42,0.25)]">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">Judul Stage</p>
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-neutral-900">ARGUMENTATION</h2>
            <p className="text-sm font-semibold text-accent-700">
              Argumentasi {currentIndex + 1} dari {totalItems}
            </p>
          </div>

          <div className="rounded-[24px] bg-neutral-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-500">Pertanyaan</p>
            <p className="mt-3 text-base leading-relaxed text-neutral-900 font-semibold">{question.question}</p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-4">
            <div className="overflow-hidden rounded-[24px] bg-neutral-100">
              <Image
                src={question.photoSrc}
                alt={question.photoAlt ?? 'Argumentation asset'}
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[20px] border border-primary-100 bg-primary-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <RobotMascot variant="inline" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary-700">AI Tutor</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-800">{tutorMessage}</p>
                </div>
              </div>
            </div>

            <label htmlFor="comic2-arg-answer" className="block text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">
              Jawabanmu
            </label>
            <textarea
              id="comic2-arg-answer"
              ref={textareaRef}
              value={answer}
              onChange={(event) => {
                const nextValue = event.target.value;
                setAnswer(nextValue);
                onAnswerChange(nextValue);
                requestAnimationFrame(adjustTextareaHeight);
              }}
              placeholder="Tuliskan alasanmu di sini..."
              className="min-h-[150px] w-full resize-none rounded-[24px] border border-neutral-200 bg-white px-4 py-4 text-sm leading-relaxed text-neutral-900 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className={`text-xs font-semibold ${charCount < 20 ? 'text-warning-600' : 'text-accent-600'}`}>
                {charCount < 20 ? `Minimal 20 karakter (${charCount}/20)` : `${charCount} karakter`}
              </span>
              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-[20px] bg-accent-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sedang menganalisis...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="space-y-4">
          <FeedbackCard feedback={feedback} />
          <button
            type="button"
            onClick={() => {
              void onNext();
            }}
            className="relative z-10 w-full rounded-[24px] bg-accent-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-accent-700"
          >
            Lanjut
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
