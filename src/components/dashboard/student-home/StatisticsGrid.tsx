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
    <section className="rounded-[28px] bg-[#F8FAFF] p-[14px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-2 gap-[12px]">
        {statCards.map((stat) => (
          <div key={stat.label} className="flex min-h-[100px] items-center gap-[12px] rounded-[24px] bg-white px-[14px] py-[14px] shadow-sm">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]" style={{ background: stat.bg }}>
              <Image src={stat.iconAsset} alt={stat.label} width={32} height={32} className="h-[32px] w-[32px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[32px] font-black leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
              <p className="mt-[4px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
