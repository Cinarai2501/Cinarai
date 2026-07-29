'use client';

import Image from 'next/image';

type StatCard = {
  label: string;
  value: string;
  iconAsset: string;
  bg: string;
  valueColor: string;
};

type StatisticsGridProps = {
  statCards: StatCard[];
};

export default function StatisticsGrid({ statCards }: StatisticsGridProps) {
  return (
    <section className="rounded-[24px] bg-white p-[12px] shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-2 gap-[12px]">
        {statCards.map((stat) => (
          <div key={stat.label} className="flex min-h-[96px] items-center rounded-[24px] border border-[#E5E7EB] p-[12px]" style={{ background: stat.bg }}>
            <div className="flex items-center gap-[10px]">
              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/70">
                <Image src={stat.iconAsset} alt={stat.label} width={32} height={32} className="h-[32px] w-[32px] object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[18px] font-black leading-[1.1]" style={{ color: stat.valueColor }}>{stat.value}</p>
                <p className="mt-[2px] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
