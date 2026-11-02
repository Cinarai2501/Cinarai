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
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-brand-100 bg-white px-4 py-6 lg:flex">
        <Link href="/dashboard/guru" className="mb-9 flex items-center gap-3 px-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-700 text-lg font-black text-white">C</span>
          <span>
            <span className="block text-base font-black tracking-wide text-ink">CINARAI</span>
            <span className="block text-xs text-secondary-content">Ruang Guru</span>
          </span>
        </Link>
        <nav aria-label="Navigasi dashboard guru" className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleTabClick(tab.id)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  active ? 'bg-brand-50 text-brand-800' : 'text-secondary-content hover:bg-canvas'
                }`}
              >
                <span className="text-lg" aria-hidden="true">{tab.icon}</span>
                {tab.label === 'Ringkasan' ? 'Dashboard' : tab.label === 'AI' ? 'Analisis AI' : tab.label}
              </button>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-ui-border pt-4">
          <Link href="/guru/report" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-secondary-content hover:bg-canvas">
            <span aria-hidden="true">📄</span> Laporan guru
          </Link>
          <Link href="/profile/edit" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-secondary-content hover:bg-canvas">
            <span aria-hidden="true">👤</span> Profil akun
          </Link>
          <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-error-700 hover:bg-error-50">
            <span aria-hidden="true">↪</span> Keluar
          </button>
        </div>
      </aside>

      <nav
        aria-label="Navigasi dashboard guru"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pt-2 lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="relative mx-auto max-w-lg" ref={moreRef}>
        {moreOpen && (
          <div
            id="guru-more-menu"
            className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-2xl border border-ui-border bg-white p-1.5 shadow-xl"
          >
            <Link
              href="/guru/report"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-secondary-content hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              📄 <span className="ml-2">Laporan guru</span>
            </Link>
            <Link
              href="/profile/edit"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-secondary-content hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
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

        <div className="grid grid-cols-5 rounded-2xl border border-ui-border bg-white/95 p-1 shadow-lg backdrop-blur-md">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleTabClick(tab.id)}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  active ? 'bg-brand-700 text-white shadow-sm' : 'text-secondary-content hover:bg-brand-50'
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
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
              moreOpen ? 'bg-brand-50 text-brand-700' : 'text-secondary-content hover:bg-brand-50'
            }`}
          >
            <span className="text-base leading-none" aria-hidden="true">•••</span>
            <span>Lainnya</span>
          </button>
        </div>
      </div>
      </nav>
    </>
  );
}
