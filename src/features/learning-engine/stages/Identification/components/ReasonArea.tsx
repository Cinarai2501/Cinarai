'use client';

const MAX_CHARS = 500;

interface ReasonAreaProps {
  itemId: string;
  targetIndex: number;
  value: string;
  isSaved: boolean;
  onChange: (itemId: string, reason: string) => void;
  onSave: (itemId: string) => void;
}

export default function ReasonArea({
  itemId,
  value,
  isSaved,
  onChange,
  onSave,
}: ReasonAreaProps) {
  const canSave = value.trim().length > 0 && !isSaved;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary-200 bg-primary-50 p-4">
      <label htmlFor={`reason-${itemId}`} className="flex items-center gap-2">
        <span className="text-xl">💬</span>
        <span className="text-sm font-black text-primary-800">
          Kenapa kamu memilih jawaban itu?
        </span>
      </label>

      <textarea
        id={`reason-${itemId}`}
        value={value}
        disabled={isSaved}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) onChange(itemId, e.target.value);
        }}
        placeholder="Contoh: Karena saya melihat bentuk kubus pada bangunan candi…"
        rows={3}
        className={[
          'w-full resize-none rounded-xl border-2 px-4 py-3 text-sm leading-relaxed outline-none transition-colors',
          isSaved
            ? 'border-neutral-100 bg-neutral-50 text-neutral-500 cursor-default'
            : 'border-primary-200 bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
        ].join(' ')}
      />

      {isSaved ? (
        <div className="flex items-center gap-2 text-accent-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-black">✓</span>
          <span className="text-sm font-bold">Alasan tersimpan!</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(itemId)}
          className="flex w-full items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-primary-600 px-5 py-3 text-base font-black text-white shadow-sm transition-all hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {canSave ? '💾 Simpan Alasan' : 'Tulis alasanmu dulu ya!'}
        </button>
      )}
    </div>
  );
}
