'use client';

import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import AnswerOptions from './AnswerOptions';

interface PocActivityItemProps {
  item: IdentificationItem;
  checked: boolean;
  onCheck: () => void;
}

/**
 * PoC-only variant of ActivityItem for item[0].
 * checked/onCheck are lifted to IdentificationActivity so the overlay can react.
 * Does NOT affect quiz state, routing, or other items.
 */
export default function PocActivityItem({ item, checked, onCheck }: PocActivityItemProps) {
  const { selectOption } = useIdentificationContext();

  const hasSelection = item.selectedOptionId !== null;
  const isCorrect = checked && item.selectedOptionId === item.correctOptionId;
  const isWrong = checked && item.selectedOptionId !== item.correctOptionId;
  const correctOption = item.options.find((o) => o.id === item.correctOptionId);

  return (
    <li
      className={[
        'flex flex-col gap-3 rounded-[24px] border-2 p-3 shadow-sm sm:p-4',
        checked
          ? isCorrect ? 'border-accent-300 bg-accent-50' : 'border-error-300 bg-error-50'
          : 'border-neutral-200 bg-white',
      ].join(' ')}
    >
      {/* Question number + text */}
      <div className="flex items-start gap-3">
        <span
          className={[
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
            checked
              ? isCorrect ? 'bg-accent-500 text-white' : 'bg-error-500 text-white'
              : 'bg-primary-600 text-white',
          ].join(' ')}
        >
          {checked ? (isCorrect ? '✓' : '✗') : item.targetIndex + 1}
        </span>
        <p className="flex-1 pt-0.5 text-base font-black leading-snug text-neutral-800">
          {item.question}
        </p>
      </div>

      {/* Answer options — locked after checked */}
      <AnswerOptions
        options={item.options}
        selectedOptionId={item.selectedOptionId}
        correctOptionId={checked ? item.correctOptionId : null}
        isAnswered={checked}
        onSelect={(optionId) => {
          if (!checked) selectOption(item.id, optionId);
        }}
      />

      {/* CEK JAWABAN button — only shown before checking */}
      {!checked && (
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => onCheck()}
          className={[
            'w-full rounded-2xl py-4 text-base font-black transition-all',
            hasSelection
              ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          ].join(' ')}
        >
          CEK JAWABAN
        </button>
      )}

      {/* Feedback — only shown after CEK JAWABAN */}
      {checked && (
        <div
          className={[
            'flex flex-col gap-2 rounded-2xl border p-3 poc-feedback-pop',
            isCorrect ? 'border-accent-200 bg-white' : 'border-error-200 bg-white',
          ].join(' ')}
        >
          <span
            className={[
              'text-base font-black',
              isCorrect ? 'text-accent-700' : 'text-error-700',
            ].join(' ')}
          >
            {isCorrect ? '✅ Benar!' : '❌ Kurang Tepat'}
          </span>
          {isWrong && correctOption && (
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
