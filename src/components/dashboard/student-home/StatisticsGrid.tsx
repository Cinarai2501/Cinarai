'use client';

import Image from 'next/image';

type StatCard = {
  label: string;
  value: string;
  iconAsset: string;
  bg: string;
  valueColor: string;
  sublabel?: string;
};

type StatisticsGridProps = {
  statCards: StatCard[];
};

export default function StatisticsGrid({ statCards }: StatisticsGridProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-2"
            style={{ background: stat.bg }}
          >
            <Image
              src={stat.iconAsset}
              alt={stat.label}
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold leading-tight text-slate-900">
              {stat.value}
            </p>
            <p className="text-[12px] font-medium text-slate-500 truncate">
              {stat.sublabel ?? stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
