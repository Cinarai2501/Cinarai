'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export type GuruDashboardTab = 'overview' | 'students' | 'ai' | 'modules';

const tabs: Array<{ id: GuruDashboardTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Ringkasan', icon: '📊' },
  { id: 'students', label: 'Siswa', icon: '👥' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'modules', label: 'Modul', icon: '📚' },
];

interface Props {
  activeTab: GuruDashboardTab;
  onTabChange: (tab: GuruDashboardTab) => void;
  onLogout: () => void;
}

export function GuruBottomNav({ activeTab, onTabChange, onLogout }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [moreOpen]);

  const handleTabClick = (tab: GuruDashboardTab) => {
    setMoreOpen(false);
    onTabChange(tab);
  };

  return (
    <nav
      aria-label="Navigasi dashboard guru"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pt-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="relative mx-auto max-w-lg" ref={moreRef}>
        {moreOpen && (
          <div
            id="guru-more-menu"
            className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl"
          >
            <Link
              href="/guru/report"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-neutral-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
            >
              📄 <span className="ml-2">Laporan guru</span>
            </Link>
            <Link
              href="/profile/edit"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-neutral-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
            >
              👤 <span className="ml-2">Profil akun</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
              className="flex min-h-12 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-error-700 hover:bg-error-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-error-600"
            >
              ↪ <span className="ml-2">Keluar</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-5 rounded-2xl border border-neutral-200/90 bg-white/95 p-1 shadow-[0_-8px_24px_rgba(37,99,235,0.12)] backdrop-blur-md">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleTabClick(tab.id)}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${
                  active ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-primary-50'
                }`}
              >
                <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="guru-more-menu"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${
              moreOpen ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-primary-50'
            }`}
          >
            <span className="text-base leading-none" aria-hidden="true">•••</span>
            <span>Lainnya</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
