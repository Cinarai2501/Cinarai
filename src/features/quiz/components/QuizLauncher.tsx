'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';

const isSafeExternalUrl = (value: string | null): value is string => {
  if (!value) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export function openQuiz(quizUrl: string | null): boolean {
  if (!isSafeExternalUrl(quizUrl) || typeof window === 'undefined') {
    return false;
  }

  window.open(quizUrl, '_blank', 'noopener,noreferrer');
  return true;
}

type QuizLauncherProps = {
  type?: 'internal' | 'external';
  href?: string;
  quizUrl: string | null;
  disabled?: boolean;
  children: string;
};

export default function QuizLauncher({ type = 'external', href, quizUrl, disabled = false, children }: QuizLauncherProps) {
  const isDisabled = disabled || !isSafeExternalUrl(quizUrl);

  if (type === 'internal' && href && !disabled) {
    return (
      <Link
        href={href}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0055D6] active:scale-[0.98] sm:w-auto sm:min-w-32"
      >
        {children}
      </Link>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isDisabled) openQuiz(quizUrl);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="min-h-11 w-full rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0055D6] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none sm:w-auto sm:min-w-32"
    >
      {children}
    </button>
  );
}
