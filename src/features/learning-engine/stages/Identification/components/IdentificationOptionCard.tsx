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

function getShapeIcon(text: string) {
  const key = text.toLowerCase();
  if (key.includes('kubus')) {
    return {
      label: 'Kubus',
      icon: (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <rect x="10" y="18" width="44" height="30" rx="6" fill="currentColor" />
          <path d="M10 18L32 6L54 18" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M54 18V48" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M32 6V36" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      ),
    };
  }
  if (key.includes('balok')) {
    return {
      label: 'Balok',
      icon: (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <rect x="12" y="16" width="40" height="32" rx="5" fill="currentColor" />
          <path d="M12 16L32 4L52 16" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M52 16V48" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M32 4V36" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      ),
    };
  }
  if (key.includes('prisma')) {
    return {
      label: 'Prisma',
      icon: (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <path d="M12 18L32 8L52 18L52 46L12 46Z" fill="currentColor" />
          <path d="M12 18L12 46" stroke="white" strokeWidth="4" />
          <path d="M52 18L52 46" stroke="white" strokeWidth="4" />
          <path d="M32 8V46" stroke="white" strokeWidth="4" />
        </svg>
      ),
    };
  }
  if (key.includes('limas')) {
    return {
      label: 'Limas',
      icon: (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <path d="M12 48L32 12L52 48Z" fill="currentColor" />
          <path d="M12 48L52 48" stroke="white" strokeWidth="4" />
          <path d="M32 12L32 48" stroke="white" strokeWidth="4" />
        </svg>
      ),
    };
  }
  if (key.includes('kerucut')) {
    return {
      label: 'Kerucut',
      icon: (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <path d="M16 16L32 48L48 16Z" fill="currentColor" />
          <ellipse cx="32" cy="52" rx="18" ry="6" fill="currentColor" />
        </svg>
      ),
    };
  }
  return {
    label: 'Bangun ruang',
    icon: (
      <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
        <circle cx="32" cy="32" r="20" fill="currentColor" />
      </svg>
    ),
  };
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
  const shape = getShapeIcon(option.text);

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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-primary-700 sm:h-16 sm:w-16">
          {shape.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={['text-base font-semibold leading-snug', isSelected ? 'text-primary-900' : 'text-neutral-800'].join(' ')}>
                {option.text}
              </p>
            </div>
            {isSelected && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                ✓
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
