'use client';

import type { AnswerOption } from '../types';

interface AnswerOptionsProps {
  options: AnswerOption[];
  selectedOptionId: string | null;
  isSaved: boolean;
  onSelect: (optionId: string) => void;
}

export default function AnswerOptions({
  options,
  selectedOptionId,
  isSaved,
  onSelect,
}: AnswerOptionsProps) {
  return (
    <ul className="flex flex-col gap-2.5" role="radiogroup">
      {options.map((option) => {
        const isSelected = option.id === selectedOptionId;
        return (
          <li key={option.id}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isSaved}
              onClick={() => onSelect(option.id)}
              className={[
                'w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-all min-h-[52px]',
                isSaved && isSelected
                  ? 'bg-accent-50 border-2 border-accent-400 text-accent-800 cursor-default'
                  : isSaved
                    ? 'bg-neutral-50 border-2 border-neutral-100 text-neutral-400 cursor-default'
                    : isSelected
                      ? 'bg-primary-50 border-2 border-primary-500 text-primary-800 shadow-sm'
                      : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50 active:scale-[0.98]',
              ].join(' ')}
            >
              {/* Radio indicator */}
              <span className={[
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isSelected && isSaved
                  ? 'border-accent-500 bg-accent-500'
                  : isSelected
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-neutral-300 bg-white',
              ].join(' ')}>
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="flex-1 leading-snug">{option.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
