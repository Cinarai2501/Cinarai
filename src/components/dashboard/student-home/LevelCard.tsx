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
    <section className="relative z-10 -mt-[8px] rounded-[24px] bg-white p-[14px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]" style={{ maxHeight: 90 }}>
      <div className="flex h-full items-center gap-[12px]">
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[16px] bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={40} height={40} className="h-[30px] w-[30px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Level</p>
              <p className="mt-[2px] text-[14px] font-black leading-[1.05] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <div className="rounded-full bg-[#EFF6FF] px-[8px] py-[4px] text-[9px] font-semibold text-[#1D4ED8]">XP</div>
          </div>
          <div className="mt-[6px] flex items-center justify-between gap-[10px] text-[9px] font-semibold text-[#6B7280]">
            <span>{totalXp}/{levelInfo.nextXp} XP</span>
            <span className="rounded-full bg-[#EEF4FB] px-2 py-[2px] text-[#475569]">{levelInfo.progress}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
