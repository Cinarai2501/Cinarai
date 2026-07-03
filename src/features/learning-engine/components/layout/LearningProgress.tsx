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
    <div className="bg-white border-b border-neutral-100 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-neutral-800 truncate">
          {STAGE_LABELS[currentStage]}
        </span>
        <span className="text-xs font-black text-primary-600 ml-3 flex-shrink-0">
          {percentage}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-neutral-400">
          <span className="font-bold text-accent-600">{completedCount}</span> selesai
        </span>
        <span className="text-[11px] text-neutral-400">
          <span className="font-bold text-neutral-600">{remainingCount}</span> tersisa
        </span>
      </div>
    </div>
  );
}
