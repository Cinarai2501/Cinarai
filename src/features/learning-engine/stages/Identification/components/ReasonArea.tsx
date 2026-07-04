'use client';

const MAX_CHARS = 500;

interface ReasonAreaProps {
  itemId: string;
  targetIndex: number;
  value: string;
  isSaved: boolean;
  onChange: (itemId: string, reason: string) => void;
}

export default function ReasonArea({
  itemId,
  value,
  isSaved,
  onChange,
}: ReasonAreaProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary-200 bg-primary-50 p-5">
      <label htmlFor={`reason-${itemId}`} className="flex items-center gap-3">
        <span className="text-3xl">💬</span>
        <span className="text-xl font-black text-primary-800">
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
          'w-full resize-none rounded-2xl border-2 px-5 py-4 text-xl leading-relaxed outline-none transition-colors',
          isSaved
            ? 'border-neutral-100 bg-neutral-50 text-neutral-500 cursor-default'
            : 'border-primary-200 bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
        ].join(' ')}
      />

      {isSaved ? (
        <div className="flex items-center gap-3 rounded-2xl bg-accent-50 border-2 border-accent-200 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white text-xl font-black flex-shrink-0">✓</span>
          <span className="text-xl font-bold text-accent-700">Alasan tersimpan!</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm text-neutral-600">
          Jawaban dan alasanmu tersimpan otomatis.
        </div>
      )}
    </div>
  );
}
