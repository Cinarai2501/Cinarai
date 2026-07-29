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
  const stroke = active ? 'stroke-white' : 'stroke-[#6B7280]';
  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={stroke} d="M3 12l9-8 9 8v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={stroke} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path className={stroke} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={stroke} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={stroke} d="M4 6h16M4 12h10M4 18h10" />
          <path className={stroke} d="M18 8l3 3-3 3" />
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={stroke} d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path className={stroke} d="M4 21v-2a4 4 0 0 1 3-3.87" />
          <path className={stroke} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
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
      className="fixed inset-x-0 bottom-0 z-50 px-[20px]"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto flex h-[72px] max-w-[440px] items-center justify-between rounded-[24px] border border-white/60 px-[12px] py-[8px]"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 20px rgba(15,23,42,0.06)',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center gap-[3px] text-center"
            >
              <span
                className="grid h-[44px] w-[44px] place-items-center rounded-[14px] transition-all duration-200 active:scale-90"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)',
                        boxShadow: '0 4px 14px rgba(29,147,255,0.40)',
                        transform: 'scale(1.05)',
                      }
                    : {}
                }
              >
                <TabIcon type={tab.icon} active={active} />
              </span>
              <span
                className="text-[12px] leading-none transition-all duration-200"
                style={{ fontWeight: active ? 600 : 500, color: active ? '#1D93FF' : '#6B7280' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
