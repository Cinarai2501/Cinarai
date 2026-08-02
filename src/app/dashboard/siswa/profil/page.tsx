'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import type { UserDocument } from '@/types/firestore';

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

function getAvatarAsset(firstName: string) {
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
  const { user, updateUserProfile, logout } = useAuth();
  const { getProgress } = useAllComicProgress();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [gender, setGender] = useState<UserDocument['gender'] | ''>(user?.gender ?? '');
  const [classLevel, setClassLevel] = useState<UserDocument['classLevel'] | ''>(user?.classLevel ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Siswa';
  const email = user?.email ?? 'siswa@email.com';
  const username = user?.username ?? email.split('@')[0];
  const avatarAsset = user?.photoURL?.trim()
    ? user.photoURL
    : user?.avatar?.trim()
      ? user.avatar
      : getAvatarAsset(firstName);
  const modalAvatarPreview = photoURL?.trim()
    ? photoURL
    : avatar?.trim()
      ? avatar
      : getAvatarAsset(firstName);

  // Compute stats
  const comics = useMemo(() => getAllComics(), []);
  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setNickname(user?.nickname ?? '');
    setGender(user?.gender ?? '');
    setClassLevel(user?.classLevel ?? '');
    setBio(user?.bio ?? '');
    setAvatar(user?.avatar ?? '');
    setPhotoURL(user?.photoURL ?? '');
  }, [user]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || undefined,
        nickname: nickname.trim() || undefined,
        gender: gender || undefined,
        classLevel: classLevel || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });
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
    <div className="mx-auto min-h-screen max-w-[1200px] bg-[#F8FAFC] pb-[100px] text-neutral-900">
      {/* 1. HEADER PROFIL */}
      <section className="relative w-full overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[#0F766E] to-[#14B8A6] px-6 pb-20 pt-[max(32px,env(safe-area-inset-top))] text-white shadow-md">
        {/* Dekorasi Awan/Bintang */}
        <div className="absolute top-4 left-6 text-white/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
        </div>
        <div className="absolute top-12 right-1/3 text-white/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
        </div>
        <div className="absolute -bottom-10 left-0 w-full opacity-20">
          <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-white fill-current">
            <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-[32px] font-extrabold leading-tight tracking-wide text-white">
              Profil
            </h1>
            <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/90 max-w-[200px]">
              Kelola akun dan pengaturan aplikasi
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E0F2FE] shadow-[0_4px_12px_rgba(15,118,110,0.4)] overflow-hidden border-2 border-white/20">
              <Image
                src={avatarAsset}
                alt={`${displayName} avatar`}
                width={88}
                height={88}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-0 right-0 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white text-[#0F766E] shadow-md transition hover:scale-110 active:scale-95"
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

      {/* USER INFO FLOATING CARD */}
      <div className="relative z-20 -mt-10 px-5">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[28px] bg-[#E0F2FE] border border-slate-200">
                <Image
                  src={avatarAsset}
                  alt={`${displayName} avatar`}
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

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {user?.nickname ? (
                <div className="rounded-[24px] bg-[#ECFDF5] px-4 py-3 text-[13px] font-semibold text-[#065F46]">
                  Panggilan: {user.nickname}
                </div>
              ) : null}
              {user?.gender ? (
                <div className="rounded-[24px] bg-[#FCE7F3] px-4 py-3 text-[13px] font-semibold text-[#9D174D]">
                  Jenis Kelamin: {user.gender}
                </div>
              ) : null}
              {user?.classLevel ? (
                <div className="rounded-[24px] bg-[#EFF6FF] px-4 py-3 text-[13px] font-semibold text-[#1D4ED8]">
                  Kelas: {user.classLevel}
                </div>
              ) : null}
              <div className="rounded-[24px] bg-[#FEF3C7] px-4 py-3 text-[13px] font-semibold text-[#92400E]">
                {user?.role === 'teacher' ? 'Guru' : 'Siswa'} CINARAI
              </div>
            </div>

            {user?.bio ? (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-[14px] leading-relaxed text-slate-700">
                <p className="font-bold text-slate-900">Tentang Saya</p>
                <p className="mt-2 whitespace-pre-line">{user.bio}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#1E293B]">Detail Profil</h3>
                <p className="mt-1 text-[13px] text-slate-500">Periksa dan perbarui data profil siswa.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="rounded-2xl bg-[#0D9488] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0F766E]"
              >
                Edit Profil
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] bg-slate-50 p-4 text-[14px] text-slate-700">
                <p className="text-slate-500">Nama Panggilan</p>
                <p className="mt-1 font-semibold text-[#1E293B]">{user?.nickname ?? '-'}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4 text-[14px] text-slate-700">
                <p className="text-slate-500">Jenis Kelamin</p>
                <p className="mt-1 font-semibold text-[#1E293B]">{user?.gender ?? '-'}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4 text-[14px] text-slate-700">
                <p className="text-slate-500">Kelas</p>
                <p className="mt-1 font-semibold text-[#1E293B]">{user?.classLevel ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* 2. MENU PENGATURAN UTAMA & 3. LOGOUT */}
        <div className="rounded-[28px] bg-white p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] border border-slate-100 divide-y divide-slate-100/80">
          {/* Edit Profil */}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
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
          </button>

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
          <h2 className="text-[16px] font-extrabold text-[#1E293B] px-1">Ringkasan Akun</h2>
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

      {/* Edit Profil Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#1E293B]">Edit Profil</h3>
                <p className="mt-1 text-[13px] text-slate-500">Perbarui data profil siswa dengan cepat.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-sm border border-slate-200">
                  <Image
                    src={modalAvatarPreview}
                    alt="Pratinjau avatar"
                    width={72}
                    height={72}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#1E293B]">Pratinjau Avatar</p>
                  <p className="mt-1 text-[12px] text-slate-500">Gunakan foto profil atau avatar khusus.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  Nama Lengkap
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                  />
                </label>

                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  Nama Panggilan
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Contoh: Ara"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                    Username
                    <input
                      value={username}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-[14px] font-semibold text-[#64748B] outline-none"
                    />
                  </label>
                  <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                    Jenis Kelamin
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as UserDocument['gender'] | '')}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  Kelas
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as UserDocument['classLevel'] | '')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                  >
                    <option value="">Pilih kelas</option>
                    <option value="Kelas I">Kelas I</option>
                    <option value="Kelas II">Kelas II</option>
                    <option value="Kelas III">Kelas III</option>
                    <option value="Kelas IV">Kelas IV</option>
                    <option value="Kelas V">Kelas V</option>
                    <option value="Kelas VI">Kelas VI</option>
                  </select>
                </label>

                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  Tentang Saya
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Ceritakan sedikit tentang dirimu"
                    className="min-h-[112px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10 resize-none"
                  />
                </label>

                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  URL Avatar (Opsional)
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                  />
                </label>

                <label className="block space-y-1.5 text-[14px] font-bold text-[#334155]">
                  URL Foto Profil (Opsional)
                  <input
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#1E293B] outline-none transition-all focus:border-[#0D9488] focus:bg-white focus:ring-4 focus:ring-[#0D9488]/10"
                  />
                </label>
              </div>

              {status && <p className="text-[13px] font-bold text-[#0D9488] animate-pulse">{status}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !displayName.trim()}
                  className="rounded-xl bg-[#0D9488] px-6 py-2.5 text-[14px] font-bold text-white shadow-md transition-all hover:bg-[#0F766E] hover:shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
