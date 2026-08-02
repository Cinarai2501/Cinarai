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
    <section className="relative z-10 min-h-[144px] rounded-3xl bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.10)]" style={{ minHeight: 144 }}>
      <div className="flex h-full items-center gap-3">
        <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Level</p>
              <p className="mt-1 text-[20px] font-semibold leading-tight text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <div className="rounded-full bg-[#EEF7FF] px-2.5 py-1 text-[12px] font-semibold text-[#1D93FF]">
              XP
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[14px] font-semibold text-[#6B7280]">
            <span>{totalXp}/{levelInfo.nextXp} XP</span>
            <span className="rounded-full bg-[#EEF7FF] px-2 py-[2px] text-[12px] text-[#1D93FF]">{levelInfo.progress}%</span>
          </div>
          <div className="mt-2 h-[12px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5] transition-all duration-500 ease-out" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
