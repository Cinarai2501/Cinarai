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
    <section className="relative z-10 -mt-[18px] min-h-[140px] rounded-[28px] bg-white p-[18px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="flex h-full items-start gap-[16px]">
        <div className="mt-[2px] flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#EEF7FF]">
          <Image src={levelIconAsset} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[8px]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
              <p className="mt-[2px] text-[18px] font-black leading-[1.15] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
            </div>
            <p className="pt-[1px] text-[11px] font-semibold text-[#9CA3AF]">XP</p>
          </div>
          <div className="mt-[8px] flex items-center justify-between gap-[8px] text-[11px] font-semibold text-[#6B7280]">
            <span>{totalXp} / {levelInfo.nextXp} XP</span>
            <span className="text-[11px] font-semibold text-[#6B7280]">{levelInfo.nextXp} target</span>
          </div>
          <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
