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
    <section className="grid grid-cols-2 gap-3">
      {statCards.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] min-h-[84px]">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl" style={{ background: stat.bg }}>
            <Image src={stat.iconAsset} alt={stat.label} width={30} height={30} className="h-[30px] w-[30px] object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-bold leading-tight text-[#111827]">{stat.value}</p>
            <p className="text-[12px] font-medium text-[#6B7280]">{stat.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
