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
      <div className="flex items-center gap-3 rounded-2xl bg-accent-50 border-2 border-accent-200 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white text-xl font-black flex-shrink-0">✓</span>
        <span className="text-xl font-bold text-accent-700">Jawaban tersimpan!</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={() => onSave(itemId)}
      className="flex w-full items-center justify-center gap-2 min-h-[68px] rounded-2xl bg-primary-600 px-5 py-4 text-2xl font-black text-white shadow-sm transition-all hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed active:scale-[0.97]"
    >
      {canSave ? '💾 Simpan Jawaban' : 'Pilih jawaban dulu ya!'}
    </button>
  );
}
