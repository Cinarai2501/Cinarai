'use client';

import { MenuBookIcon, PeopleIcon, SchoolIcon, TrendingUpIcon } from './GuruIcons';

type GuruStatCardProps = {
  title: string;
  value: string;
  icon: 'people' | 'school' | 'menuBook' | 'trendingUp';
  accent: string;
};

function renderIcon(icon: GuruStatCardProps['icon'], className: string) {
  switch (icon) {
    case 'people':
      return <PeopleIcon className={className} />;
    case 'school':
      return <SchoolIcon className={className} />;
    case 'menuBook':
      return <MenuBookIcon className={className} />;
    case 'trendingUp':
      return <TrendingUpIcon className={className} />;
    default:
      return null;
  }
}

export function GuruStatCards({ stats }: { stats: GuruStatCardProps[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.title} className="rounded-[24px] border border-neutral-100 bg-white p-4 shadow-sm shadow-neutral-200/70">
          <div className={`inline-flex rounded-2xl p-3 ${stat.accent}`}>
            {renderIcon(stat.icon, 'h-5 w-5')}
          </div>
          <p className="mt-4 text-sm font-semibold text-neutral-500">{stat.title}</p>
          <p className="mt-1 text-2xl font-black text-neutral-900">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
