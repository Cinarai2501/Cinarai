'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ArgumentationLearningObject } from '@/features/learning-engine/stages/Argumentation/data/argumentationQuestions';

interface Comic6ArgumentationStageProps {
  question: ArgumentationLearningObject;
  onSubmitFeedback: (feedback: { level: 'SANGAT_BAIK'; score: number; feedback: string; suggestion?: string }) => void;
  onAnswerChange: (value: string) => void;
  onNext: () => void | Promise<void>;
  feedback: { feedback: string; score: number } | null;
  currentIndex: number;
  totalItems: number;
  initialAnswer?: string;
  isAdvancing: boolean;
}

function readSelection(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export default function Comic6ArgumentationStage({
  question,
  onSubmitFeedback,
  onAnswerChange,
  onNext,
  feedback,
  currentIndex,
  totalItems,
  initialAnswer = '',
  isAdvancing,
}: Comic6ArgumentationStageProps) {
  const characteristics = question.characteristics ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(() => readSelection(initialAnswer));
  const [tryAgainMessage, setTryAgainMessage] = useState<string | null>(null);
  const isAnswered = Boolean(feedback);

  useEffect(() => {
    setSelectedIds(readSelection(initialAnswer));
    setTryAgainMessage(null);
  }, [initialAnswer, question.id]);

  const toggleCharacteristic = (id: string) => {
    if (isAnswered) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    setTryAgainMessage(null);
    onAnswerChange(JSON.stringify(next));
  };

  const submit = () => {
    const expectedIds = characteristics.filter((item) => item.correct).map((item) => item.id);
    const isCorrect = expectedIds.length === selectedIds.length && expectedIds.every((id) => selectedIds.includes(id));

    if (!isCorrect) {
      setTryAgainMessage(
        question.argumentationHint ?? 'Belum tepat. Coba perhatikan kembali ciri-ciri bangun ruang ini.',
      );
      return;
    }

    onSubmitFeedback({
      level: 'SANGAT_BAIK',
      score: 10,
      feedback: question.argumentationAnswer ?? question.aiFeedback ?? 'Benar! Alasanmu sesuai dengan ciri-ciri bangun ruang.',
      suggestion: 'Kamu sudah menghubungkan objek dengan ciri-cirinya.',
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-600">Yuk, jelaskan alasanmu!</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-neutral-900">ARGUMENTASI</h1>
        <p className="text-sm font-bold text-accent-700">Langkah {currentIndex + 1} dari {totalItems}</p>
        <p className="text-sm leading-relaxed text-neutral-600">
          Perhatikan objek Masjid Al-Akbar. Jelaskan mengapa objek tersebut menyerupai bangun ruang tertentu berdasarkan ciri-cirinya.
        </p>
      </header>

      <section className="overflow-hidden rounded-[22px] border border-primary-100 bg-white shadow-sm">
        <div className="relative aspect-[16/9] bg-neutral-100">
          <Image
            src={question.image}
            alt={question.objectName}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 720px"
            onError={() => {
              if (process.env.NODE_ENV !== 'production') {
                console.error(`Argumentation asset Komik 6 tidak ditemukan: ${question.image}`);
              }
            }}
          />
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-neutral-950/75 px-3 py-2 text-center text-sm font-black text-white">
            {question.objectName}
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="rounded-[18px] bg-primary-50 p-4">
            <p className="text-base font-black leading-relaxed text-neutral-900">{question.question}</p>
            <p className="mt-2 text-sm font-bold text-primary-800">Objek ini menyerupai {question.solid} karena...</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-[11px] font-black uppercase tracking-[0.22em] text-neutral-500">Pilih ciri yang mendukung</legend>
            {characteristics.map((characteristic) => {
              const isSelected = selectedIds.includes(characteristic.id);
              return (
                <label
                  key={characteristic.id}
                  className={`flex min-h-[54px] cursor-pointer items-start gap-3 rounded-[16px] border p-4 transition active:scale-[0.99] ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white hover:border-primary-300'} ${isAnswered ? 'cursor-default opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isAnswered}
                    onChange={() => toggleCharacteristic(characteristic.id)}
                    className="mt-1 h-5 w-5 accent-[var(--color-primary-600)]"
                  />
                  <span className="text-sm font-semibold leading-relaxed text-neutral-800">{characteristic.label}</span>
                </label>
              );
            })}
          </fieldset>

          {!isAnswered ? (
            <button
              type="button"
              onClick={submit}
              disabled={selectedIds.length === 0}
              className="min-h-[52px] w-full rounded-[18px] bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Susun alasanku
            </button>
          ) : null}

          {tryAgainMessage ? (
            <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              <p className="font-black">Belum tepat. Coba lagi.</p>
              <p className="mt-1">💡 Petunjuk: {tryAgainMessage}</p>
            </div>
          ) : null}

          {feedback ? (
            <div className="space-y-3 rounded-[18px] border border-accent-200 bg-accent-50 p-4">
              <p className="font-black text-accent-800">Benar!</p>
              <p className="text-sm leading-relaxed text-neutral-800">{feedback.feedback}</p>
              <button
                type="button"
                onClick={() => void onNext()}
                disabled={isAdvancing}
                className="min-h-[50px] w-full rounded-[16px] bg-accent-600 px-4 py-3 text-sm font-black text-white transition hover:bg-accent-700 disabled:opacity-60"
              >
                {isAdvancing ? 'Menyimpan...' : currentIndex === totalItems - 1 ? 'Selesaikan argumentasi' : 'Lanjut'}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
