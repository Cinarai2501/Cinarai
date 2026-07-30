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
    <section className="rounded-[26px] bg-[#F8FAFF] p-[8px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-2 gap-[7px]">
        {statCards.map((stat) => (
          <div key={stat.label} className="flex min-h-[76px] items-center gap-[10px] rounded-[20px] bg-white px-[10px] py-[10px] shadow-sm">
            <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ background: stat.bg }}>
              <Image src={stat.iconAsset} alt={stat.label} width={24} height={24} className="h-[24px] w-[24px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[22px] font-black leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
              <p className="mt-[2px] text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
