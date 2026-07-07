'use client';

interface IdentificationProgressProps {
  observedCount: number;
  totalCount: number;
  isComplete: boolean;
}

export default function IdentificationProgress({
  observedCount,
  totalCount,
  isComplete,
}: IdentificationProgressProps) {
  const percentage = totalCount > 0 ? Math.round((observedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-neutral-500">Progress</p>
          <p className="text-base font-black text-neutral-900">
            {isComplete ? 'Komplet' : `${percentage}% selesai`}
          </p>
        </div>
        <span className="text-base font-black text-primary-600">{percentage}%</span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress ${percentage} persen`}
        />
      </div>
    </div>
  );
}
