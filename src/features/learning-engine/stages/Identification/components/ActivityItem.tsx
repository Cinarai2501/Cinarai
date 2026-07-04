'use client';

import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import AnswerOptions from './AnswerOptions';
import NoteArea from './NoteArea';
import SaveButton from './SaveButton';
import ReasonArea from './ReasonArea';

interface ActivityItemProps {
  item: IdentificationItem;
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const { selectOption, setNote, save, setReason, saveReason } = useIdentificationContext();

  const isSaved = item.answerStatus === 'SAVED';
  const isReasonSaved = item.reasonStatus === 'SAVED';
  const canSave = item.selectedOptionId !== null && !isSaved;

  return (
    <li className={[
      'flex flex-col gap-4 rounded-3xl border-2 p-4 transition-all',
      isReasonSaved
        ? 'border-accent-300 bg-accent-50'
        : 'border-neutral-200 bg-white shadow-sm',
    ].join(' ')}>

      {/* Nomor soal + pertanyaan */}
      <div className="flex items-start gap-3">
        <span className={[
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-black shadow-sm',
          isReasonSaved
            ? 'bg-accent-500 text-white'
            : 'bg-primary-600 text-white',
        ].join(' ')}>
          {isReasonSaved ? '✓' : item.targetIndex + 1}
        </span>
        <p className="text-base font-bold text-neutral-800 leading-snug flex-1 pt-1">
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

      {/* Tombol simpan jawaban */}
      {!isSaved && (
        <SaveButton
          itemId={item.id}
          canSave={canSave}
          isSaved={isSaved}
          onSave={save}
        />
      )}

      {/* Area alasan — muncul setelah jawaban disimpan */}
      {isSaved && (
        <ReasonArea
          itemId={item.id}
          targetIndex={item.targetIndex}
          value={item.reason}
          isSaved={isReasonSaved}
          onChange={setReason}
          onSave={saveReason}
        />
      )}
    </li>
  );
}
