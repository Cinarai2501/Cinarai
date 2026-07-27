'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard/siswa/home', label: 'Home', icon: 'home' },
  { href: '/dashboard/siswa/komik', label: 'Komik', icon: 'book' },
  { href: '/dashboard/siswa/ai-tutor', label: 'AI Tutor', icon: 'chat' },
  { href: '/dashboard/siswa/kuis', label: 'Kuis', icon: 'quiz' },
  { href: '/dashboard/siswa/profil', label: 'Profil', icon: 'user' },
];

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const strokeClass = active ? 'stroke-white' : 'stroke-neutral-500';

  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={strokeClass} d="M3 12l9-8 9 8v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={strokeClass} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path className={strokeClass} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={strokeClass} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={strokeClass} d="M4 6h16M4 12h10M4 18h10" />
          <path className={strokeClass} d="M18 8l3 3-3 3" />
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={strokeClass} d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path className={strokeClass} d="M4 21v-2a4 4 0 0 1 3-3.87" />
          <path className={strokeClass} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function StudentBottomNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-6px_18px_rgba(15,23,42,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[440px] items-center justify-between gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[0] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-center transition ${
                active ? 'bg-primary-600 text-white shadow-[0_6px_12px_rgba(24,117,204,0.2)]' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px]">
                <TabIcon type={tab.icon} active={active} />
              </span>
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
