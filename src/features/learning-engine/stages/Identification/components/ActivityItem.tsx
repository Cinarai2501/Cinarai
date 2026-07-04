'use client';

import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import AnswerOptions from './AnswerOptions';
import NoteArea from './NoteArea';
import ReasonArea from './ReasonArea';

interface ActivityItemProps {
  item: IdentificationItem;
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const { selectOption, setNote, setReason, autoSaveState } = useIdentificationContext();

  const isSaved = item.answerStatus === 'SAVED';
  const isReasonSaved = item.reasonStatus === 'SAVED';
  const status = autoSaveState[item.id];

  return (
    <li className={[
      'flex flex-col gap-5 rounded-3xl border-2 p-5 transition-all',
      isReasonSaved
        ? 'border-accent-300 bg-accent-50'
        : 'border-neutral-200 bg-white shadow-sm',
    ].join(' ')}>

      {/* Nomor soal + pertanyaan */}
      <div className="flex items-start gap-4">
        <span className={[
          'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-black shadow-sm',
          isReasonSaved
            ? 'bg-accent-500 text-white'
            : 'bg-primary-600 text-white',
        ].join(' ')}>
          {isReasonSaved ? '✓' : item.targetIndex + 1}
        </span>
        <p className="text-2xl font-black text-neutral-800 leading-snug flex-1 pt-1.5">
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

      {/* Catatan */}
      <NoteArea
        itemId={item.id}
        value={item.note}
        isSaved={isSaved}
        onChange={setNote}
      />

      {status?.message && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700">
          {status.message}
        </div>
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
