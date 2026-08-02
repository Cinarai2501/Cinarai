'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';

function getAvatarAsset(firstName: string) {
  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

export default function DashboardSiswaProfilPage() {
  const { user, updateUserProfile, logout } = useAuth();
  const { getProgress } = useAllComicProgress();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Siswa';
  const email = user?.email ?? 'siswa@email.com';
  const avatarAsset = user?.photoURL?.trim() ? user.photoURL : getAvatarAsset(firstName);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateUserProfile(displayName.trim(), photoURL.trim() || undefined);
      setStatus('Profil berhasil diperbarui!');
      setTimeout(() => {
        setShowEditModal(false);
        setStatus(null);
      }, 1000);
    } catch {
      setStatus('Gagal memperbarui profil. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setStatus('Gagal logout. Coba lagi.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] bg-[#F5F8FD] px-3 pb-28 sm:px-6 lg:px-8 space-y-4">
      {/* 1. Header Profil */}
      <section
        className="relative overflow-hidden rounded-[28px] px-5 pt-6 pb-16 sm:px-8 sm:pt-7 sm:pb-20 text-white shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
          minHeight: '160px',
        }}
      >
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-[28px] font-extrabold leading-tight text-white">
              Profil
            </h1>
            <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/90">
              Kelola akun dan pengaturan aplikasi
            </p>
          </div>

          {/* Profile Picture with Camera Badge */}
          <div className="relative flex-shrink-0">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-white/20 p-1 ring-4 ring-white/30 shadow-md">
              <Image
                src={avatarAsset}
                alt={`${displayName} avatar`}
                width={80}
                height={80}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="absolute -bottom-1 -right-1 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white text-[#0F766E] shadow-md transition hover:scale-110 active:scale-95"
              aria-label="Ubah foto profil"
            >
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* User Info Floating Card */}
      <div className="relative z-20 -mt-12 px-2">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100">
          <h2 className="text-[20px] font-bold text-[#1E293B]">
            {user?.displayName ?? 'Siswa CINARAI'}
          </h2>
          <p className="mt-0.5 text-[14px] font-medium text-[#64748B]">{email}</p>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3.5 py-1 text-[13px] font-semibold text-[#15803D]">
            <span>⭐ Level 2 - Penjelajah</span>
          </div>
        </div>
      </div>

      {/* 2. Menu Pengaturan Utama */}
      <div className="space-y-3 pt-2">
        <div className="rounded-3xl bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100 divide-y divide-slate-100">
          {/* Edit Profil */}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#CCFBF1] text-[#0D9488]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Edit Profil</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Ubah nama, foto, dan informasi dirimu</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Pengaturan Akun */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Pengaturan Akun</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Kelola informasi akun dan preferensi</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Ganti Password */}
          <Link
            href="/auth/forgot-password"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Ganti Password</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Ubah password akunmu</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Bahasa */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#FFEDD5] text-[#EA580C]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Bahasa</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Pilih bahasa aplikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[13px] font-semibold text-[#0D9488]">Bahasa Indonesia</span>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>

          {/* Pusat Bantuan */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#16A34A]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Pusat Bantuan</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Bantuan seputar penggunaan aplikasi</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Tentang Aplikasi */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1E293B]">Tentang Aplikasi</h3>
                <p className="text-[12px] font-medium text-[#64748B] truncate">Informasi tentang CINARAI</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Logout Item */}
      <div className="rounded-3xl bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-red-50 rounded-2xl"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#EF4444]">
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
              <p className="text-[12px] font-medium text-[#64748B] truncate">Keluar dari akun</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* 4. Ringkasan Akun Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-[16px] font-bold text-[#1E293B] px-1">Ringkasan Akun</h2>

        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100">
          {/* Stat 1: Total XP */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-2xl bg-amber-50 text-2xl drop-shadow-sm">
              ⭐
            </div>
            <p className="mt-2 text-[18px] font-bold leading-none text-[#1E293B]">{totalXp}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#64748B]">Total XP</p>
          </div>

          {/* Stat 2: Streak */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-2xl bg-orange-50 text-2xl drop-shadow-sm">
              🔥
            </div>
            <p className="mt-2 text-[18px] font-bold leading-none text-[#1E293B]">{completedComics > 0 ? 3 : 0}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#64748B]">Streak</p>
          </div>

          {/* Stat 3: Komik Selesai */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-2xl bg-emerald-50 text-2xl drop-shadow-sm">
              📖
            </div>
            <p className="mt-2 text-[18px] font-bold leading-none text-[#1E293B]">{completedComics}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#64748B]">Komik Selesai</p>
          </div>

          {/* Stat 4: Level saat ini */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-2xl bg-purple-50 text-2xl drop-shadow-sm">
              🛡️
            </div>
            <p className="mt-2 text-[14px] font-bold leading-none text-[#1E293B]">Level 2</p>
            <p className="mt-1 text-[10px] font-semibold text-[#64748B]">Penjelajah</p>
          </div>
        </div>
      </div>

      {/* Edit Profil Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1E293B]">Edit Profil</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-1 text-[#94A3B8] hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-semibold text-[#334155]">
                Nama Lengkap
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </label>

              <label className="block space-y-1.5 text-sm font-semibold text-[#334155]">
                URL Foto Profil (Opsional)
                <input
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </label>

              {status ? <p className="text-xs font-semibold text-[#0F766E]">{status}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D9488] disabled:opacity-60"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
