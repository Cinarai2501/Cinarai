'use client';

import Image from 'next/image';
import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationOptionGrid from './IdentificationOptionGrid';
import IdentificationFeedback from './IdentificationFeedback';

interface IdentificationQuestionProps {
  item: IdentificationItem;
  isChecked: boolean;
  onCheck?: () => void;
}

export default function IdentificationQuestion({
  item,
  isChecked,
  onCheck,
}: IdentificationQuestionProps) {
  const { selectOption, cover } = useIdentificationContext();

  const hasSelection = item.selectedOptionId !== null;
  const isCorrect = item.selectedOptionId === item.correctOptionId;
  const selectedOption = item.options.find((option) => option.id === item.selectedOptionId) ?? null;
  const correctOption = item.options.find((option) => option.id === item.correctOptionId) ?? null;
  const contextImage = cover || '/comics/komik-1/cover.png';

  return (
    <li className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-lg shadow-neutral-100 transition-all hover:-translate-y-0.5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="overflow-hidden rounded-[28px] border border-neutral-100 bg-neutral-50">
          <div className="relative aspect-[16/10] w-full bg-neutral-100">
            <Image
              src={contextImage}
              alt="Gambar konteks Candi Jawi"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-600 text-xl font-black text-white">
                {item.targetIndex + 1}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold uppercase tracking-[0.16em] text-primary-700">Nomor soal</p>
                <p className="mt-1 text-lg font-black leading-snug text-neutral-900 sm:text-xl">
                  {item.question}
                </p>
              </div>
            </div>

            {isChecked && (
              <span
                className={[
                  'rounded-full px-4 py-2 text-base font-black',
                  isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-error-100 text-error-700',
                ].join(' ')}
              >
                {isCorrect ? 'Jawaban Benar' : 'Jawaban Kurang Tepat'}
              </span>
            )}
          </div>

          <p className="text-base leading-relaxed text-neutral-600">
            Pilih jawaban yang paling sesuai dengan cerita yang kamu amati.
          </p>

          <div className="space-y-4">
            <IdentificationOptionGrid
              options={item.options}
              selectedOptionId={item.selectedOptionId}
              correctOptionId={isChecked ? item.correctOptionId : null}
              isAnswered={isChecked}
              disabled={isChecked}
              onSelect={(optionId) => selectOption(item.id, optionId)}
            />

            {!isChecked && onCheck && (
              <button
                type="button"
                disabled={!hasSelection}
                onClick={onCheck}
                className={['w-full rounded-2xl py-4 text-base font-black transition duration-200',
                  hasSelection
                    ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                ].join(' ')}
              >
                CEK JAWABAN
              </button>
            )}

            {isChecked && (
              <IdentificationFeedback
                isCorrect={isCorrect}
                selectedOptionText={selectedOption?.text ?? 'Belum dijawab'}
                correctOptionText={correctOption?.text ?? '-'}
                explanation={item.explanation}
                showCorrectOption={!isCorrect}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
