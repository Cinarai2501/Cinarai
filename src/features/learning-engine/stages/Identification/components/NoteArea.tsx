'use client';

interface NoteAreaProps {
  itemId: string;
  value: string;
  isSaved: boolean;
  onChange: (itemId: string, note: string) => void;
}

export default function NoteArea({ itemId, value, isSaved, onChange }: NoteAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`note-${itemId}`}
        className="flex items-center gap-2 text-base md:text-lg font-black text-neutral-700"
      >
        <span className="text-xl md:text-3xl">📝</span>
        Catatan Kamu
      </label>
      <textarea
        id={`note-${itemId}`}
        value={value}
        disabled={isSaved}
        onChange={(e) => onChange(itemId, e.target.value)}
        placeholder="Tulis di mana kamu menemukan konsep ini dalam cerita…"
        rows={3}
        className={[
          'w-full resize-none rounded-2xl border-2 px-5 py-4 text-base md:text-lg leading-relaxed outline-none transition-colors',
          isSaved
            ? 'border-neutral-100 bg-neutral-50 text-neutral-500 cursor-default'
            : 'border-neutral-200 bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
        ].join(' ')}
      />
    </div>
  );
}
