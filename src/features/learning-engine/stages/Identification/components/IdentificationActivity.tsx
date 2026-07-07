'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useIdentificationContext } from '../context/IdentificationContext';
import ActivityItem from './ActivityItem';
import PocActivityItem from './PocActivityItem';
import ShapeOverlay, { shapeConfigFromText } from './ShapeOverlay';

export default function IdentificationActivity() {
  const { state, lokasi } = useIdentificationContext();
  const { items, isComplete } = state;

  // PoC: checked state for item[0] — lifted here so overlay can react
  const [pocChecked, setPocChecked] = useState(false);

  const pocItem = items[0];
  const selectedText = pocItem?.options.find((o) => o.id === pocItem.selectedOptionId)?.text ?? null;
  const shapeConfig = shapeConfigFromText(selectedText);
  const overlay = shapeConfig ?? { x: 120, y: 80, width: 200, height: 150, rotation: 0, color: '#6366f1' };
  const pocCorrect: boolean | null = pocChecked
    ? pocItem !== undefined && pocItem.selectedOptionId === pocItem.correctOptionId
    : null;

  return (
    <div className="flex flex-col gap-3">

      {/* PoC: image + overlay, co-located with questions */}
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-neutral-100">
        <Image
          src="/comics/komik-1/cover.png"
          alt="Komik cover"
          width={800}
          height={600}
          className="w-full h-auto block"
          priority
        />
        <ShapeOverlay
          x={overlay.x}
          y={overlay.y}
          width={overlay.width}
          height={overlay.height}
          rotation={overlay.rotation}
          color={overlay.color}
          correct={pocCorrect}
          visible
        />
      </div>

      <ul className="flex flex-col gap-4">
        {items.map((item) =>
          item.targetIndex === 0
            ? <PocActivityItem key={item.id} item={item} checked={pocChecked} onCheck={() => setPocChecked(true)} />
            : <ActivityItem key={item.id} item={item} />
        )}
      </ul>

      {isComplete && (
        <div className="rounded-xl bg-accent-500 px-4 py-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div>
            <p className="text-lg font-black text-white leading-tight">Hebat! Semua soal selesai!</p>
            <p className="text-sm text-accent-100">Kamu berhasil di {lokasi}. Tekan Lanjut!</p>
          </div>
        </div>
      )}
    </div>
  );
}
