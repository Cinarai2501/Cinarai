'use client';

import Image from 'next/image';

type StatCard = {
  label: string;
  value: string;
  iconAsset: string;
  bg: string;
  valueColor: string;
  sublabel?: string;
  scale?: string;
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
          className="flex items-center gap-3 rounded-[28px] bg-white p-3 pr-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100"
        >
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm"
            style={{ background: stat.bg }}
          >
            <Image
              src={stat.iconAsset}
              alt={stat.label}
              width={52}
              height={52}
              className={`h-full w-full object-contain ${stat.scale || 'scale-[1.35]'}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold leading-tight text-slate-900">
              {stat.value}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              {stat.sublabel ?? stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
