'use client';

import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import AnswerOptions from './AnswerOptions';
import ReasonArea from './ReasonArea';

interface ActivityItemProps {
  item: IdentificationItem;
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const { selectOption, setReason, autoSaveState } = useIdentificationContext();

  const isSaved = item.answerStatus === 'SAVED';
  const isReasonSaved = item.reasonStatus === 'SAVED';
  const status = autoSaveState[item.id];

  return (
    <li className={[
      'flex flex-col gap-3 rounded-[24px] border-2 p-3 shadow-sm transition-all sm:p-4',
      isReasonSaved
        ? 'border-accent-300 bg-accent-50'
        : 'border-neutral-200 bg-white',
    ].join(' ')}>

      {/* Nomor soal + pertanyaan */}
      <div className="flex items-start gap-3">
        <span className={[
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
          isReasonSaved ? 'bg-accent-500 text-white' : 'bg-primary-600 text-white',
        ].join(' ')}>
          {isReasonSaved ? '✓' : item.targetIndex + 1}
        </span>
        <p className="flex-1 pt-0.5 text-sm font-black leading-snug text-neutral-800 sm:text-base">
          {item.question}
        </p>
      </div>

      {/* Pilihan jawaban */}
      <AnswerOptions
        options={item.options}
        selectedOptionId={item.selectedOptionId}
        isSaved={isSaved}
        onSelect={(optionId) => selectOption(item.id, optionId)}
      />

      {status?.message && (
        <p className="text-sm font-semibold text-neutral-500 px-1">{status.message}</p>
      )}

      {/* Area alasan — muncul setelah jawaban disimpan */}
      {isSaved && (
        <ReasonArea
          itemId={item.id}
          targetIndex={item.targetIndex}
          value={item.reason}
          isSaved={isReasonSaved}
          onChange={setReason}
        />
      )}
    </li>
  );
}
