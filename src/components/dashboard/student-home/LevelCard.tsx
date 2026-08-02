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
    <section className="relative z-10 -mt-10 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 p-0.5 shadow-inner ring-1 ring-amber-200 overflow-hidden">
          <Image
            src={levelIconAsset}
            alt={`Level ${levelInfo.level}`}
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-bold text-slate-800 truncate">
              Level {levelInfo.level} - {levelInfo.name}
            </span>
            <span className="text-[13px] font-bold text-[#0066FF] shrink-0">
              {totalXp} / {levelInfo.nextXp} XP
            </span>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0077FF] to-[#0055FF] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, levelInfo.progress))}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
