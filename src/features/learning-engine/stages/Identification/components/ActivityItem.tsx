'use client';

import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import AnswerOptions from './AnswerOptions';

interface ActivityItemProps {
  item: IdentificationItem;
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const { selectOption } = useIdentificationContext();

  const isAnswered = item.answerStatus === 'SAVED';
  const isCorrect = isAnswered && item.selectedOptionId === item.correctOptionId;
  const correctOption = item.options.find((o) => o.id === item.correctOptionId);

  return (
    <li className={[
      'flex flex-col gap-3 rounded-[24px] border-2 p-3 shadow-sm transition-all sm:p-4',
      isAnswered
        ? isCorrect ? 'border-accent-300 bg-accent-50' : 'border-error-300 bg-error-50'
        : 'border-neutral-200 bg-white',
    ].join(' ')}>

      {/* Nomor soal + pertanyaan */}
      <div className="flex items-start gap-3">
        <span className={[
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
          isAnswered
            ? isCorrect ? 'bg-accent-500 text-white' : 'bg-error-500 text-white'
            : 'bg-primary-600 text-white',
        ].join(' ')}>
          {isAnswered ? (isCorrect ? '✓' : '✗') : item.targetIndex + 1}
        </span>
        <p className="flex-1 pt-0.5 text-base font-black leading-snug text-neutral-800">
          {item.question}
        </p>
      </div>

      {/* Pilihan jawaban */}
      <AnswerOptions
        options={item.options}
        selectedOptionId={item.selectedOptionId}
        correctOptionId={isAnswered ? item.correctOptionId : null}
        isAnswered={isAnswered}
        onSelect={(optionId) => selectOption(item.id, optionId)}
      />

      {/* Feedback langsung setelah menjawab */}
      {isAnswered && (
        <div className={[
          'flex flex-col gap-2 rounded-2xl border p-3',
          isCorrect ? 'border-accent-200 bg-white' : 'border-error-200 bg-white',
        ].join(' ')}>
          <span className={[
            'text-base font-black',
            isCorrect ? 'text-accent-700' : 'text-error-700',
          ].join(' ')}>
            {isCorrect ? '✅ Benar!' : '❌ Kurang Tepat'}
          </span>
          {!isCorrect && correctOption && (
            <p className="text-base text-neutral-700">
              <span className="font-black">Jawaban yang benar: </span>
              <span className="font-bold text-accent-700">{correctOption.text}</span>
            </p>
          )}
          <p className="text-base leading-relaxed text-neutral-600">{item.explanation}</p>
        </div>
      )}
    </li>
  );
}
