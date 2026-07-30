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
    <section className="relative z-10 -mt-[40px] min-h-[86px] rounded-[26px] bg-white p-[12px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="flex h-full items-center gap-[10px]">
        <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[18px] bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={44} height={44} className="h-[44px] w-[44px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Level</p>
              <p className="mt-[2px] text-[16px] font-black leading-[1.1] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <div className="rounded-full bg-[#EFF6FF] px-[8px] py-[5px] text-[9px] font-semibold text-[#1D4ED8]">
              XP
            </div>
          </div>
          <div className="mt-[7px] flex items-center justify-between gap-[10px] text-[9px] font-semibold text-[#6B7280]">
            <span>{totalXp}/{levelInfo.nextXp} XP</span>
            <span className="rounded-full bg-[#EEF4FB] px-2 py-[2px] text-[#475569]">{levelInfo.progress}%</span>
          </div>
          <div className="mt-[7px] h-[6px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
