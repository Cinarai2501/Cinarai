'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationQuestion from './IdentificationQuestion';

export default function IdentificationActivity() {
  const { state, currentQuestionIndex, setCurrentQuestionIndex, checkedItems, setCheckedItems } = useIdentificationContext();
  const { items } = state;

  const currentItem = items[currentQuestionIndex] ?? null;
  const currentChecked = currentItem ? Boolean(checkedItems[currentItem.id]) : false;

  if (!currentItem) return null;

  return (
    <div className="flex flex-col gap-4">
      <IdentificationQuestion
        item={currentItem}
        isChecked={currentChecked}
        onCheck={() => setCheckedItems((prev) => ({ ...prev, [currentItem.id]: true }))}
      />
      {currentChecked && currentQuestionIndex < items.length - 1 && (
        <button
          type="button"
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
          className="w-full rounded-2xl bg-primary-600 px-6 py-4 text-lg font-black uppercase tracking-[0.1em] text-white transition hover:bg-primary-700 active:scale-[0.98]"
        >
          ITEM BERIKUTNYA
        </button>
      )}
    </div>
  );
}
