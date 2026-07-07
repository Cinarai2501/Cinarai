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
    <div className="flex flex-col gap-2">
      <label htmlFor={`reason-${itemId}`} className="text-base font-black text-primary-700">
        💬 Kenapa kamu memilih jawaban itu?
      </label>

      {isSaved ? (
        <p className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-base text-neutral-600">
          {value}
        </p>
      ) : (
        <textarea
          id={`reason-${itemId}`}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) onChange(itemId, e.target.value);
          }}
          placeholder="Tulis alasanmu di sini…"
          rows={4}
          className="w-full min-h-[150px] resize-none rounded-2xl border-2 border-primary-200 bg-white px-4 py-3 text-base text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      )}
    </div>
  );
}
