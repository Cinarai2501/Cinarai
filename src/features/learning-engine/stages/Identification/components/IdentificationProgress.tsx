'use client';

interface IdentificationProgressProps {
  observedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
}

export default function IdentificationProgress({
  observedCount,
  totalCount,
  isComplete,
}: IdentificationProgressProps) {
  return (
    <div className={[
      'rounded-2xl px-4 py-3 flex items-center gap-3',
      isComplete
        ? 'bg-accent-50 border-2 border-accent-300'
        : 'bg-white border-2 border-neutral-100',
    ].join(' ')}>
      <span className="text-2xl flex-shrink-0">{isComplete ? '🎉' : '📊'}</span>
      <div className="flex-1 min-w-0">
        <p className={[
          'text-sm font-black leading-tight',
          isComplete ? 'text-accent-700' : 'text-neutral-800',
        ].join(' ')}>
          {isComplete ? 'Semua soal selesai!' : `Soal ${observedCount} dari ${totalCount} selesai`}
        </p>
        <div className="mt-1.5 h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={[
              'h-2.5 rounded-full transition-all duration-500',
              isComplete
                ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                : 'bg-gradient-to-r from-primary-400 to-primary-600',
            ].join(' ')}
            style={{ width: totalCount > 0 ? `${Math.round((observedCount / totalCount) * 100)}%` : '0%' }}
            role="progressbar"
            aria-valuenow={observedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label={`${observedCount} dari ${totalCount} soal selesai`}
          />
        </div>
      </div>
      <span className={[
        'text-sm font-black flex-shrink-0',
        isComplete ? 'text-accent-600' : 'text-primary-600',
      ].join(' ')}>
        {observedCount}/{totalCount}
      </span>
    </div>
  );
}
