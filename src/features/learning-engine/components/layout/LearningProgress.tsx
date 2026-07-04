'use client';

import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.Cover]:             '📖 Cover',
  [Stage.Contextualization]: '📚 Baca Komik',
  [Stage.Identification]:    '🔍 Identifikasi',
  [Stage.Navigation]:        '🧭 Navigasi',
  [Stage.Argumentation]:     '💬 Argumentasi',
  [Stage.Resolution]:        '💡 Resolusi',
  [Stage.Application]:       '🎯 Penerapan',
  [Stage.Introspection]:     '🪞 Refleksi',
  [Stage.Finish]:            '🏆 Selesai',
};

// Cover is now rendered inside the engine — all learning stages are visible.
const VISIBLE_STAGES = LEARNING_STAGES.filter((s) => s !== Stage.Finish);

export default function LearningProgress() {
  const { currentStage, progress } = useLearningEngine();

  const visibleIndex = VISIBLE_STAGES.indexOf(currentStage as typeof VISIBLE_STAGES[number]);
  // stageNumber: 1-based; clamp to valid range for Finish stage
  const stageNumber = visibleIndex !== -1 ? visibleIndex + 1 : VISIBLE_STAGES.length;
  const totalVisible = VISIBLE_STAGES.length;

  return (
    <div className="bg-white border-b border-neutral-100 px-4 py-2 sm:px-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-neutral-700 truncate">
          {STAGE_LABELS[currentStage]}
        </span>
        <span className="text-sm font-black text-primary-600 ml-2 flex-shrink-0">
          Tahap {Math.min(stageNumber, totalVisible)} dari {totalVisible}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
          style={{ width: `${progress.percentage}%` }}
          role="progressbar"
          aria-valuenow={stageNumber}
          aria-valuemin={1}
          aria-valuemax={totalVisible}
          aria-label={`Tahap ${stageNumber} dari ${totalVisible}`}
        />
      </div>
    </div>
  );
}
