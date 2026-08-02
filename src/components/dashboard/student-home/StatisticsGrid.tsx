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
    <section className="rounded-3xl bg-[#F6F9FE] p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="flex min-h-[96px] items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.08)]" style={{ background: stat.bg }}>
              <Image src={stat.iconAsset} alt={stat.label} width={32} height={32} className="h-[32px] w-[32px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[32px] font-bold leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
              <p className="mt-1 text-[14px] font-medium text-[#6B7280]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
