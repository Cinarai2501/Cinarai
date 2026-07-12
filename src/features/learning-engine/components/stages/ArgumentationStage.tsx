'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { loadIdentificationAnswers } from '../../stages/Identification/services/identificationAnswerService';
import {
  getArgumentationLearningObject,
  getArgumentationLearningObjects,
  type ArgumentationLearningObject,
} from '../../stages/Argumentation/data/argumentationQuestions';
import { loadComicModule } from '@/features/comics';

/* eslint-disable @next/next/no-img-element */

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
}

function ShapeIcon({ solid, className }: { solid: string; className?: string }) {
  const normalized = solid.toLowerCase();

  if (normalized.includes('kerucut')) {
    return (
      <div className={className} aria-label={solid}>
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <path d="M60 12 L92 96 L28 96 Z" fill="none" stroke="#1875cc" strokeWidth="6" strokeLinejoin="round" />
          <path d="M60 12 L72 42 L48 42 Z" fill="none" stroke="#1875cc" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('kubus')) {
    return (
      <div className={className} aria-label={solid}>
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <rect x="28" y="34" width="64" height="64" rx="12" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M28 34 L60 18 L92 34" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M92 34 L92 98" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M28 34 L28 98" fill="none" stroke="#1875cc" strokeWidth="6" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('balok')) {
    return (
      <div className={className} aria-label={solid}>
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <rect x="26" y="34" width="68" height="58" rx="8" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M26 34 L56 18 L124 18" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M94 34 L124 18" fill="none" stroke="#1875cc" strokeWidth="6" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('prisma')) {
    return (
      <div className={className} aria-label={solid}>
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <path d="M24 36 L60 20 L96 36 L96 86 L60 102 L24 86 Z" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M24 36 L60 52 L96 36" fill="none" stroke="#1875cc" strokeWidth="6" />
          <path d="M60 52 L60 102" fill="none" stroke="#1875cc" strokeWidth="6" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} aria-label={solid}>
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="60" cy="60" r="32" fill="none" stroke="#1875cc" strokeWidth="6" />
      </svg>
    </div>
  );
}

function getQuestionForObject(object: ArgumentationLearningObject) {
  return `Mengapa ${object.objectName.toLowerCase()} Candi Jawi dapat dimodelkan sebagai ${object.solid.toLowerCase()}?`;
}

function FeedbackCard({ feedback, studentAnswer }: { feedback: AiFeedback; studentAnswer: string }) {
  const badge =
    feedback.level === 'SANGAT_BAIK'
      ? { label: 'Sangat Baik', emoji: '✅' }
      : feedback.level === 'PERLU_PERBAIKAN'
        ? { label: 'Perlu Perbaikan', emoji: '🔎' }
        : { label: 'Hampir Benar', emoji: '✨' };

  return (
    <div className="overflow-hidden rounded-[24px] border border-accent-200 bg-accent-50 shadow-sm">
      <div className="flex items-center gap-3 border-b border-accent-100 bg-white/70 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-100 text-xl">
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-accent-700">AI Feedback</p>
          <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-accent-700">
            {badge.emoji} {badge.label}
          </p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Jawabanmu</p>
          <p className="mt-1 text-sm italic leading-relaxed text-neutral-600">“{studentAnswer}”</p>
        </div>
        <p className="text-sm leading-relaxed text-neutral-800">{feedback.feedback}</p>
      </div>
    </div>
  );
}

export default function ArgumentationStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();
  const { user } = useAuth();
  const comicModule = useMemo(() => loadComicModule(comic.id), [comic.id]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid || !comic.id) return;

    let active = true;

    void loadIdentificationAnswers(user.uid, comic.id).then((items) => {
      if (!active) return;
      const shapes = items.flatMap((item) => item.selectedShapes ?? []);
      setSelectedShapes(shapes);
    });

    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  const learningObject = useMemo(() => getArgumentationLearningObject(selectedShapes), [selectedShapes]);
  const question = useMemo(() => {
    if (!learningObject) {
      return 'Mengapa bagian candi ini dapat dimodelkan sebagai bangun ruang?';
    }

    if (comic.id === 1) {
      const comicQuestion = comicModule.argumentation.questions.find((entry) => entry.shapeName === learningObject.solid || entry.templePart === learningObject.objectName);
      return comicQuestion?.question ?? getQuestionForObject(learningObject);
    }

    return getQuestionForObject(learningObject);
  }, [comic.id, comicModule.argumentation.questions, learningObject]);
  const charCount = answer.trim().length;
  const canSubmit = charCount >= 20 && !isSubmitting && !feedback;

  useEffect(() => {
    setCanAdvance(Boolean(feedback));
  }, [feedback, setCanAdvance]);

  const handleSubmit = useCallback(async () => {
    if (!learningObject || !canSubmit) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai/argumentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          studentAnswer: answer,
          shapeName: learningObject.solid,
          templePart: learningObject.objectName,
          comicTitle: comic.title,
          lokasi: comic.lokasi,
          classLevel: comic.kelas,
        }),
      });

      const data = (await response.json()) as {
        feedback?: string;
        level?: FeedbackLevel;
        score?: number;
      };

      setFeedback({
        level: data.level ?? 'HAMPIR_BENAR',
        score: Math.min(5, Math.max(1, Number(data.score) || 4)),
        feedback: data.feedback ?? learningObject.aiFeedback,
      });
    } catch {
      setFeedback({
        level: 'HAMPIR_BENAR',
        score: 4,
        feedback: learningObject.aiFeedback,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, canSubmit, comic.kelas, comic.lokasi, comic.title, learningObject, question]);

  if (!learningObject) {
    return (
      <div className="rounded-[24px] bg-white p-5 text-sm text-neutral-600 shadow-sm">
        Memuat objek belajar dari hasil identifikasi...
      </div>
    );
  }

  const feedbackCards = getArgumentationLearningObjects().filter((entry) => entry.id !== learningObject.id).slice(0, 4);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <header className="rounded-[24px] bg-gradient-to-br from-secondary-400 to-secondary-600 px-4 py-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80">Argumentation</p>
        <h2 className="mt-1 text-lg font-black text-white">Jelaskan alasanmu berdasarkan objek yang kamu pilih.</h2>
      </header>

      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-secondary-600">Pertanyaan Argumentasi</p>
        <p className="mt-2 text-base font-black leading-relaxed text-neutral-900">{question}</p>
      </div>

      <div className="rounded-[24px] border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="overflow-hidden rounded-[20px] bg-neutral-50">
          <img src={learningObject.image} alt={learningObject.objectName} className="h-56 w-full object-cover sm:h-64" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-[20px] bg-white p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400">Dimodelkan sebagai</div>
          <div className="flex h-36 w-36 items-center justify-center rounded-[28px] border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
            <ShapeIcon solid={learningObject.solid} className="h-full w-full" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-neutral-900">{learningObject.objectName}</p>
            <p className="text-lg font-black text-secondary-600">{learningObject.solid}</p>
          </div>
          {comic.id === 1 && (
            <div className="rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-secondary-700">
              {learningObject.objectName === 'Bagian Atap' ? '📍 Bagian Atap' : learningObject.objectName === 'Bagian Tubuh' ? '📍 Bagian Tubuh' : learningObject.objectName === 'Bagian Pintu' ? '📍 Bagian Pintu' : '📍 Bagian Tangga'}
            </div>
          )}
        </div>
      </div>

      {!feedback ? (
        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <label htmlFor="argumentation-answer" className="mb-2 block text-sm font-black text-neutral-700">
            Tuliskan alasanmu di sini...
          </label>
          <textarea
            id="argumentation-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={6}
            placeholder="Tuliskan alasanmu di sini..."
            className="w-full resize-none rounded-[20px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 outline-none transition focus:border-secondary-400 focus:bg-white"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className={charCount < 20 ? 'text-sm font-semibold text-warning-600' : 'text-sm font-semibold text-accent-600'}>
              {charCount < 20 ? `Minimal 20 karakter (${charCount}/20)` : `${charCount} karakter ✓`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="mt-4 w-full rounded-[20px] bg-secondary-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSubmitting ? 'Sedang menganalisis...' : 'Kirim Jawaban'}
          </button>
        </div>
      ) : (
        <FeedbackCard feedback={feedback} studentAnswer={answer} />
      )}

      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🖼️</span>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400">Umpan Balik Gambar</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          {comic.id === 1
            ? 'Bagian-bagian Candi Jawi yang berbeda dapat dimodelkan dengan bangun ruang yang sesuai.'
            : 'Bagian-bagian Candi Jawi dapat dimodelkan sebagai bangun ruang berikut.'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[learningObject, ...feedbackCards].slice(0, 4).map((entry) => (
            <div key={entry.id} className="overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50">
              <img src={entry.image} alt={entry.objectName} className="h-24 w-full object-cover" />
              <div className="flex flex-col items-center gap-2 px-3 py-3 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">{entry.objectName}</div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white p-2 shadow-sm">
                  <ShapeIcon solid={entry.solid} className="h-full w-full" />
                </div>
                <p className="text-sm font-black text-neutral-900">{entry.solid}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <button
          type="button"
          onClick={() => void nextStage()}
          className="w-full rounded-[20px] bg-accent-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-accent-700"
        >
          Lanjut
        </button>
      )}
    </div>
  );
}
