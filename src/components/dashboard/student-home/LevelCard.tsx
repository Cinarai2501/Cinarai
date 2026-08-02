'use client';

import Image from 'next/image';

type LevelInfo = {
  level: number;
  name: string;
  nextXp: number;
  progress: number;
};

type LevelCardProps = {
  levelInfo: LevelInfo;
  totalXp: number;
  levelIconAsset: string;
};

export default function LevelCard({ levelInfo, totalXp, levelIconAsset }: LevelCardProps) {
  return (
    <section className="relative z-10 min-h-[100px] rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] flex flex-col justify-center">
      <div className="flex items-center gap-3">
        <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={44} height={44} className="h-[44px] w-[44px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-[#111827] truncate">
              Level {levelInfo.level} - {levelInfo.name}
            </h2>
            <div className="text-[14px] font-bold shrink-0 text-[#1D93FF]">
              {totalXp} <span className="font-medium text-[#9CA3AF]">/ {levelInfo.nextXp} XP</span>
            </div>
          </div>
          <div className="mt-2.5 h-[10px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div
              className="h-full rounded-full bg-[#1D93FF] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, levelInfo.progress)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
