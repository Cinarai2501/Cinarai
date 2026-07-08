'use client';

import type { AnswerOption } from '../types';

interface IdentificationOptionCardProps {
  option: AnswerOption;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isAnswered: boolean;
  disabled: boolean;
  onSelect: (optionId: string) => void;
}

export default function IdentificationOptionCard({
  option,
  selectedOptionId,
  correctOptionId,
  isAnswered,
  disabled,
  onSelect,
}: IdentificationOptionCardProps) {
  const isSelected = option.id === selectedOptionId;
  const isCorrectOption = option.id === correctOptionId;
  const isWrong = isAnswered && isSelected && !isCorrectOption;
  const isRight = isAnswered && isCorrectOption;

  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={disabled}
        onClick={() => onSelect(option.id)}
        className={[
          'flex min-h-[56px] w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.98]',
          isRight
            ? 'border-accent-300 bg-accent-50 shadow-lg shadow-accent-100 cursor-default'
            : isWrong
            ? 'border-error-300 bg-error-50 shadow-lg shadow-error-100 cursor-default'
            : disabled
            ? 'border-neutral-200 bg-neutral-50 cursor-default'
            : isSelected
            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
            : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            isRight
              ? 'border-accent-500 bg-accent-500'
              : isWrong
              ? 'border-error-500 bg-error-500'
              : isSelected
              ? 'border-primary-600 bg-primary-600'
              : 'border-neutral-300 bg-white',
          ].join(' ')}
        >
          {(isSelected || isRight) && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>

        <p
          className={[
            'flex-1 text-base font-semibold leading-snug',
            isRight
              ? 'text-accent-800'
              : isWrong
              ? 'text-error-800 line-through'
              : isAnswered
              ? 'text-neutral-400'
              : isSelected
              ? 'text-primary-900'
              : 'text-neutral-800',
          ].join(' ')}
        >
          {option.text}
        </p>
      </button>
    </li>
  );
}
