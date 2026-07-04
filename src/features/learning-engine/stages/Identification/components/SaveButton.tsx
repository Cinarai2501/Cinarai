'use client';

interface SaveButtonProps {
  itemId: string;
  canSave: boolean;
  isSaved: boolean;
  onSave: (itemId: string) => void;
}

export default function SaveButton({ itemId, canSave, isSaved, onSave }: SaveButtonProps) {
  if (isSaved) {
    return (
      <div className="flex items-center gap-2 text-accent-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-black">✓</span>
        <span className="text-sm font-bold">Jawaban tersimpan!</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={() => onSave(itemId)}
      className="flex w-full items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-primary-600 px-5 py-3 text-base font-black text-white shadow-sm transition-all hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed active:scale-[0.97]"
    >
      {canSave ? '💾 Simpan Jawaban' : 'Pilih jawaban dulu ya!'}
    </button>
  );
}
