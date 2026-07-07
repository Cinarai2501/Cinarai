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
        'animate-fade-in-up flex flex-col gap-3 rounded-2xl border p-4 shadow-sm',
        isCorrect ? 'border-accent-200 bg-accent-50' : 'border-error-200 bg-error-50',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className={['text-base font-black', isCorrect ? 'text-accent-700' : 'text-error-700'].join(' ')}>
          {isCorrect ? '✓ Benar' : '✗ Belum tepat'}
        </span>
      </div>

      <p className={['text-base leading-relaxed', isCorrect ? 'text-neutral-700' : 'text-neutral-700'].join(' ')}>
        {isCorrect
          ? `Kamu memilih ${selectedOptionText}. ${explanation}`
          : `Kamu memilih ${selectedOptionText}. ${explanation}`}
      </p>

      {!isCorrect && showCorrectOption && (
        <p className="text-base font-semibold text-neutral-700">
          Jawaban yang benar: {correctOptionText}
        </p>
      )}
    </div>
  );
}
