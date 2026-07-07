'use client';

import type { IdentificationItem } from '../types';

interface StepKonfirmasiItemProps {
  item: IdentificationItem;
  index: number;
  total: number;
}

export default function StepKonfirmasiItem({ item, index, total }: StepKonfirmasiItemProps) {
  const selectedOption = item.options.find((o) => o.id === item.selectedOptionId) ?? null;
  const correctOption = item.options.find((o) => o.id === item.correctOptionId) ?? null;
  const isCorrect = item.selectedOptionId === item.correctOptionId;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Soal {index + 1} dari {total}
        </span>
        <span className={[
          'rounded-full px-3 py-0.5 text-sm font-black',
          isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-error-100 text-error-700',
        ].join(' ')}>
          {isCorrect ? '✅ Benar' : '❌ Kurang Tepat'}
        </span>
      </div>

      {/* Pertanyaan */}
      <div className={[
        'rounded-2xl border-2 p-4',
        isCorrect ? 'border-accent-200 bg-accent-50' : 'border-error-200 bg-error-50',
      ].join(' ')}>
        <p className="text-sm font-black leading-snug text-neutral-800 sm:text-base">
          {item.question}
        </p>
      </div>

      {/* Feedback rows */}
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <Row
          label="Jawabanmu"
          value={selectedOption?.text ?? 'Belum dijawab'}
          highlight={isCorrect ? 'correct' : 'wrong'}
        />
        {!isCorrect && (
          <Row
            label="Jawaban yang benar"
            value={correctOption?.text ?? '-'}
            highlight="correct"
          />
        )}
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Penjelasan
          </span>
          <p className="mt-0.5 text-sm leading-relaxed text-neutral-700">
            {item.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: 'correct' | 'wrong' | 'neutral';
}) {
  const valueClass =
    highlight === 'correct'
      ? 'text-accent-700 font-bold'
      : highlight === 'wrong'
        ? 'text-error-700 font-bold line-through'
        : 'text-neutral-700';

  return (
    <div>
      <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{label}</span>
      <p className={['text-sm leading-relaxed', valueClass].join(' ')}>{value}</p>
    </div>
  );
}
