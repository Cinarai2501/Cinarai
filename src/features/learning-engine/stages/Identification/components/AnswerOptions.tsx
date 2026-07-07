'use client';

import type { AnswerOption } from '../types';

interface AnswerOptionsProps {
  options: AnswerOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isAnswered: boolean;
  onSelect: (optionId: string) => void;
}

export default function AnswerOptions({
  options,
  selectedOptionId,
  correctOptionId,
  isAnswered,
  onSelect,
}: AnswerOptionsProps) {
  return (
    <ul className="flex flex-col gap-2" role="radiogroup">
      {options.map((option) => {
        const isSelected = option.id === selectedOptionId;
        const isCorrectOption = option.id === correctOptionId;
        const isWrong = isAnswered && isSelected && !isCorrectOption;
        const isRight = isAnswered && isCorrectOption;

        return (
          <li key={option.id}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isAnswered}
              onClick={() => onSelect(option.id)}
              className={[
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98]',
                isRight
                  ? 'bg-accent-50 border-2 border-accent-400 cursor-default'
                  : isWrong
                    ? 'bg-error-50 border-2 border-error-400 cursor-default'
                    : isAnswered
                      ? 'bg-neutral-50 border-2 border-neutral-100 cursor-default'
                      : isSelected
                        ? 'bg-primary-50 border-2 border-primary-500 shadow-sm'
                        : 'bg-white border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50',
              ].join(' ')}
            >
              <span className={[
                'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isRight
                  ? 'border-accent-500 bg-accent-500'
                  : isWrong
                    ? 'border-error-500 bg-error-500'
                    : isSelected
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-neutral-300 bg-white',
              ].join(' ')}>
                {(isSelected || isRight) && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className={[
                'flex-1 text-sm font-bold leading-snug sm:text-base',
                isRight
                  ? 'text-accent-800'
                  : isWrong
                    ? 'text-error-800 line-through'
                    : isAnswered
                      ? 'text-neutral-400'
                      : isSelected
                        ? 'text-primary-800'
                        : 'text-neutral-700',
              ].join(' ')}>
                {option.text}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
