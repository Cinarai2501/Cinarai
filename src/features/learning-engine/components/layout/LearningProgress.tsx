'use client';

import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.Cover]:             'Cover',
  [Stage.Contextualization]: 'Kontekstualisasi',
  [Stage.Identification]:    'Identifikasi',
  [Stage.Navigation]:        'Navigasi',
  [Stage.Argumentation]:     'Argumentasi',
  [Stage.Resolution]:        'Resolusi',
  [Stage.Application]:       'Aplikasi',
  [Stage.Introspection]:     'Introspeksi',
  [Stage.Finish]:            'Selesai',
};

export default function LearningProgress() {
  const { currentStage, progress } = useLearningEngine();

  const total = LEARNING_STAGES.length;
  const completedCount = Math.min(progress.completedCount, total);
  const remainingCount = total - completedCount;
  const percentage = progress.percentage;

  return (
    <div className="bg-white border-b border-neutral-200 px-4 py-3 sm:px-6">
      {/* Stage aktif + persentase */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-900 truncate">
          {STAGE_LABELS[currentStage]}
        </span>
        <span className="text-xs font-bold text-primary-600 ml-3 flex-shrink-0">
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-neutral-100">
        <div
          className="h-2 rounded-full bg-primary-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Selesai & tersisa */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-neutral-500">
          <span className="font-semibold text-accent-600">{completedCount}</span>
          {' '}selesai
        </span>
        <span className="text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">{remainingCount}</span>
          {' '}tersisa
        </span>
      </div>
    </div>
  );
}
