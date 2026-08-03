'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import HeroHeader from '@/components/dashboard/HeroHeader';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];

function getLevelInfo(xp: number) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const cur = LEVEL_THRESHOLDS[level] ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = next > cur ? Math.round(((xp - cur) / (next - cur)) * 100) : 100;
  return { level: level + 1, name: LEVEL_NAMES[level] ?? 'Legenda', nextXp: next, progress };
}

function getAvatarAsset(firstName: string, gender?: 'Laki-laki' | 'Perempuan') {
  if (gender === 'Perempuan') {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  if (gender === 'Laki-laki') {
    return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
  }

  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

function getLevelIconAsset(level: number) {
  return `/assets/dashboard/home/levels/icon-level-${Math.max(1, Math.min(level, 5))}-v2.png`;
}

function getStatIconAsset(type: string) {
  switch (type) {
    case 'xp':
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
    case 'streak':
      return '/assets/dashboard/home/statistics/icon-streak.png';
    case 'comic':
      return '/assets/dashboard/home/statistics/icon-komik-selesai.png';
    default:
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
  }
}

export default function DashboardSiswaProfilPage() {
  const { user, logout } = useAuth();
  const { getProgress } = useAllComicProgress();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Siswa';
  const email = user?.email ?? 'siswa@email.com';
  const username = user?.username ?? email.split('@')[0];
  const avatarAsset = user?.photoURL?.trim()
    ? user.photoURL
    : user?.avatar?.trim()
      ? user.avatar
      : getAvatarAsset(firstName, user?.gender);

  // Compute stats
  const comics = useMemo(() => getAllComics(), []);

  const { totalXp, completedComics } = useMemo(() => {
    let completedXP = 0;
    let completedCount = 0;
    for (const comic of comics) {
      const p = getProgress(comic.id);
      if (p) {
        completedXP += p.completedCount * 15;
        if (p.isCompleted) completedCount += 1;
      }
    }
    return {
      totalXp: completedXP > 0 ? completedXP : 240,
      completedComics: completedCount,
    };
  }, [comics, getProgress]);

  const levelInfo = getLevelInfo(totalXp);
  const streak = completedComics > 0 ? Math.min(14, 3 + completedComics) : 3;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // keep logout error simple
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto min-h-0 w-full max-w-[1200px] bg-[#F8FAFC] px-4 pb-2 text-neutral-900 sm:px-5 lg:px-6">
      <HeroHeader
        title="Profil"
        subtitle="Kelola akun dan pengaturan aplikasi"
        gradientFrom="#0F766E"
        gradientTo="#14B8A6"
        rightContent={
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-[#E0F2FE] shadow-[0_4px_12px_rgba(15,118,110,0.4)]">
            <Image
              src={avatarAsset}
              alt={user?.displayName ? `${user.displayName} avatar` : 'Avatar siswa'}
              width={72}
              height={72}
              className="h-full w-full object-cover"
            />
          </div>
        }
      />

      {/* USER INFO FLOATING CARD */}
      <div className="relative z-20 -mt-10">
        <div className="grid gap-4">
          <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[28px] bg-[#E0F2FE] border border-slate-200">
                <Image
                  src={avatarAsset}
                  alt={user?.displayName ? `${user.displayName} avatar` : 'Avatar siswa'}
                  width={88}
                  height={88}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-[22px] font-extrabold text-[#1E293B] truncate">
                  {user?.displayName ?? 'Siswa CINARAI'}
                </h2>
                <p className="mt-1 text-[14px] font-medium text-[#64748B] truncate">{email}</p>
                <p className="mt-2 text-[13px] text-[#475569]">Username: <span className="font-bold text-[#0F766E]">{username}</span></p>
              </div>
            </div>

            {user?.bio ? (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-[14px] leading-relaxed text-slate-700">
                <p className="font-bold text-slate-900">Tentang Saya</p>
                <p className="mt-2 whitespace-pre-line">{user.bio}</p>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      <div className="pt-6 space-y-6">
        {/* 2. MENU PENGATURAN UTAMA & 3. LOGOUT */}
        <div className="rounded-[28px] bg-white p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] border border-slate-100 divide-y divide-slate-100/80">
          {/* Edit Profil */}
          <Link
            href="/profile/edit"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#CCFBF1] text-[#0D9488]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Edit Profil</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Ubah nama, foto, dan informasi dirimu</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Pengaturan Akun */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#DBEAFE] text-[#2563EB]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Pengaturan Akun</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Kelola informasi akun dan preferensi</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Ganti Password */}
          <Link
            href="/auth/forgot-password"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#F3E8FF] text-[#9333EA]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Ganti Password</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Ubah password akunmu</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Bahasa */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#FFEDD5] text-[#EA580C]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Bahasa</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Pilih bahasa aplikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[13px] font-bold text-[#0D9488]">Bahasa Indonesia</span>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>

          {/* Pusat Bantuan */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#DCFCE7] text-[#16A34A]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Pusat Bantuan</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Bantuan seputar penggunaan aplikasi</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Tentang Aplikasi */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#E0F2FE] text-[#0284C7]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Tentang Aplikasi</h3>
                <p className="text-[12px] font-semibold text-[#94A3B8] mt-0.5 truncate">Informasi tentang CINARAI</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-red-50/80 rounded-2xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-[#FEE2E2] text-[#EF4444]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#EF4444]">
                  {isLoggingOut ? 'Keluar...' : 'Logout'}
                </h3>
                <p className="text-[12px] font-semibold text-[#F87171] mt-0.5 truncate">Keluar dari akun dengan aman</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* 4. RINGKASAN AKUN SECTION */}
        <div className="space-y-3">
          <h2 className="px-1 text-[16px] font-extrabold text-[#1E293B]">Ringkasan Akun</h2>
          <div className="grid grid-cols-4 gap-2 rounded-[24px] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] border border-slate-100">
            {/* Stat 1: Total XP */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden drop-shadow-sm mb-1.5">
                <Image src={getStatIconAsset('xp')} alt="XP" width={48} height={48} className="object-contain scale-[1.35]" />
              </div>
              <p className="text-[16px] font-extrabold leading-none text-[#1E293B]">{totalXp}</p>
              <p className="mt-1 text-[10px] font-bold text-[#94A3B8]">Total XP</p>
            </div>

            {/* Stat 2: Streak */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden drop-shadow-sm mb-1.5">
                <Image src={getStatIconAsset('streak')} alt="Streak" width={48} height={48} className="object-contain scale-[1.35]" />
              </div>
              <p className="text-[16px] font-extrabold leading-none text-[#1E293B]">{streak}</p>
              <p className="mt-1 text-[10px] font-bold text-[#94A3B8]">Streak</p>
            </div>

            {/* Stat 3: Komik Selesai */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden drop-shadow-sm mb-1.5">
                <Image src={getStatIconAsset('comic')} alt="Komik" width={48} height={48} className="object-contain scale-[1.35]" />
              </div>
              <p className="text-[16px] font-extrabold leading-none text-[#1E293B]">{completedComics}</p>
              <p className="mt-1 text-[10px] font-bold text-[#94A3B8]">Komik Selesai</p>
            </div>

            {/* Stat 4: Level saat ini */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden drop-shadow-sm mb-1.5">
                <Image src={getLevelIconAsset(levelInfo.level)} alt="Level" width={48} height={48} className="object-contain scale-[0.9]" />
              </div>
              <p className="text-[14px] font-extrabold leading-none text-[#1E293B]">Level {levelInfo.level}</p>
              <p className="mt-1 text-[10px] font-bold text-[#94A3B8]">{levelInfo.name}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
