'use client';

interface IdentificationFeedbackProps {
  isCorrect: boolean;
  selectedOptionText: string;
  correctOptionText: string;
  explanation: string;
  showCorrectOption: boolean;
}

export default function IdentificationFeedback({
  isCorrect,
  selectedOptionText,
  correctOptionText,
  explanation,
  showCorrectOption,
}: IdentificationFeedbackProps) {
  return (
    <div
      className={[
        'animate-fade-in-up flex flex-col gap-3 rounded-[22px] border p-4 shadow-sm',
        isCorrect ? 'border-accent-200 bg-accent-50' : 'border-error-200 bg-error-50',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className={['text-base font-black', isCorrect ? 'text-accent-700' : 'text-error-700'].join(' ')}>
          {isCorrect ? '✓ Ringkasan hasil' : '✗ Ringkasan hasil'}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-neutral-700">
        Pilihanmu: {selectedOptionText || 'Belum ada pilihan'}.
      </p>

      <p className="text-sm leading-relaxed text-neutral-700">
        {explanation}
      </p>

      {!isCorrect && showCorrectOption && (
        <p className="text-sm font-semibold text-neutral-700">
          Jawaban yang benar: {correctOptionText}
        </p>
      )}
    </div>
  );
}
