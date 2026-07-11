'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationQuestion from './IdentificationQuestion';

export default function IdentificationActivity() {
  const { state, checkedItems, setCheckedItems } = useIdentificationContext();
  const { items } = state;

  const currentItem = items[0] ?? null;
  const currentChecked = currentItem ? Boolean(checkedItems[currentItem.id]) : false;

  if (!currentItem) return null;

  return (
    <div className="flex flex-col gap-4">
      <IdentificationQuestion
        item={currentItem}
        isChecked={currentChecked}
        onCheck={() => setCheckedItems((prev) => ({ ...prev, [currentItem.id]: true }))}
      />
    </div>
  );
}
