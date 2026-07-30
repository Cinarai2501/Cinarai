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
    <section className="relative z-10 -mt-[52px] min-h-[118px] rounded-[28px] bg-white p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.1)]">
      <div className="flex h-full items-start gap-[16px]">
        <div className="mt-[2px] flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[20px] bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={56} height={56} className="h-[56px] w-[56px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Level</p>
              <p className="mt-[2px] text-[20px] font-black leading-[1.1] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <div className="rounded-full bg-[#EFF6FF] px-[10px] py-[6px] text-[12px] font-semibold text-[#1D4ED8]">
              XP
            </div>
          </div>
          <div className="mt-[10px] flex flex-wrap items-center gap-[10px] text-[12px] font-semibold text-[#6B7280]">
            <span>{totalXp} dari {levelInfo.nextXp} XP</span>
            <span className="rounded-full bg-[#EEF4FB] px-2 py-1 text-[#475569]">{levelInfo.progress}%</span>
          </div>
          <div className="mt-[12px] h-[14px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
