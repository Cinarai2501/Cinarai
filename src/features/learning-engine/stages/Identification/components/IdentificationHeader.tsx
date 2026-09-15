'use client';

import { useMemo } from 'react';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { LEARNING_STAGES } from '../../../types';

export default function IdentificationHeader() {
  const { currentStage, comic } = useLearningEngine();

  const { stageNumber, totalStages } = useMemo(() => {
    const index = LEARNING_STAGES.indexOf(currentStage);
    return {
      stageNumber: index === -1 ? 0 : index + 1,
      totalStages: LEARNING_STAGES.length,
    };
  }, [currentStage]);

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary-600">Stage</p>
        <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-neutral-900 sm:text-3xl">
          {comic.id === 6 ? 'IDENTIFIKASI BANGUN RUANG' : 'IDENTIFICATION'}
        </h1>
        {comic.id === 6 && (
          <p className="mt-2 text-sm font-semibold text-neutral-600">
            Ayo temukan bangun ruang pada Masjid Al-Akbar!
          </p>
        )}
      </div>
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 whitespace-nowrap">
        Tahap {stageNumber} dari {totalStages}
      </span>
    </div>
  );
}
