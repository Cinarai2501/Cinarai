'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { label: 'Dashboard', href: '/dashboard/guru', enabled: true },
  { label: 'Siswa', href: '/dashboard/guru/siswa', enabled: true },
  { label: 'Statistik', href: '/dashboard/guru/statistik', enabled: true },
  { label: 'Analisis AI', href: '/dashboard/guru/analisis-ai', enabled: false },
  { label: 'Laporan', href: '/dashboard/guru/laporan', enabled: false },
  { label: 'Pengaturan', href: '/dashboard/guru/pengaturan', enabled: false },
];

export function GuruSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden rounded-[28px] border border-neutral-100 bg-white p-4 shadow-sm shadow-neutral-200/70 lg:block">
      <div className="rounded-[24px] bg-primary-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Menu Guru</p>
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const isEnabled = item.enabled;

            if (!isEnabled) {
              return (
                <div
                  key={item.label}
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-3 py-2 text-left text-sm font-semibold text-neutral-500 opacity-90"
                >
                  <span>{item.label}</span>
                  <span className="text-xs">→</span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-neutral-700 hover:bg-white/80'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
