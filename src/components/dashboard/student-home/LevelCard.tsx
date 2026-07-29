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
    <section className="relative z-10 -mt-[20px] rounded-[30px] bg-white p-[16px] shadow-[0_18px_36px_rgba(15,23,42,0.16)]" style={{ minHeight: 140 }}>
      <div className="flex h-full items-center gap-[14px]">
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[20px] bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
        </div>
        <div className="min-w-0 flex-1 pt-[2px]">
          <div className="flex items-start justify-between gap-[8px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
              <p className="mt-[4px] text-[18px] font-black leading-[1.15] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <p className="pt-[1px] text-[11px] font-semibold text-[#9CA3AF]">XP</p>
          </div>
          <div className="mt-[8px] flex items-center justify-between gap-[8px] text-[11px] font-semibold text-[#6B7280]">
            <span>{totalXp} XP</span>
            <span>{levelInfo.nextXp} target</span>
          </div>
          <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
