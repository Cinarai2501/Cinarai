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
    <section className="grid grid-cols-2 gap-2.5">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="soft-card flex min-h-[84px] items-center gap-2.5 rounded-[24px] p-2.5"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm"
            style={{ background: stat.bg }}
          >
            <Image
              src={stat.iconAsset}
              alt={stat.label}
              width={44}
              height={44}
              className={`h-full w-full object-contain ${stat.scale || 'scale-[1.2]'}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold leading-tight text-slate-900">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-500">
              {stat.sublabel ?? stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
