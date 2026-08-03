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
    <section className="grid grid-cols-2 gap-3.5">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="flex min-h-[118px] items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-3.5 pr-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
        >
          <div
            className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm"
            style={{ background: stat.bg }}
          >
            <Image
              src={stat.iconAsset}
              alt={stat.label}
              width={60}
              height={60}
              className={`h-full w-full object-contain ${stat.scale || 'scale-[1.45]'}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[20px] font-extrabold leading-tight text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-tight text-slate-500">
              {stat.sublabel ?? stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
