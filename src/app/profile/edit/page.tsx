'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import type { UserDocument } from '@/types/firestore';

const CLASS_OPTIONS = [
  'Kelas I',
  'Kelas II',
  'Kelas III',
  'Kelas IV',
  'Kelas V',
  'Kelas VI',
];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<UserDocument['gender'] | ''>('');
  const [classLevel, setClassLevel] = useState<UserDocument['classLevel'] | ''>('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const email = user?.email ?? 'siswa@email.com';
  const username = user?.username ?? email.split('@')[0];

  const avatarAsset = useMemo(() => {
    if (photoURL.trim()) return photoURL.trim();
    if (avatar.trim()) return avatar.trim();
    return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
  }, [avatar, photoURL]);

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setNickname(user?.nickname ?? '');
    setGender(user?.gender ?? '');
    setClassLevel(user?.classLevel ?? '');
    setBio(user?.bio ?? '');
    setAvatar(user?.avatar ?? '');
    setPhotoURL(user?.photoURL ?? '');
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-5 py-10 text-center text-neutral-900">
        <p className="text-lg font-semibold">Kamu perlu masuk terlebih dahulu untuk mengedit profil.</p>
        <div className="mt-4 flex justify-center">
          <Link href="/auth/login" className="rounded-2xl bg-[#0D9488] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0F766E]">
            Masuk
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

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
      showSnackbar('Profil berhasil diperbarui', 'success');
      router.push('/dashboard/siswa/profil');
    } catch (error) {
      showSnackbar('Gagal memperbarui profil. Coba lagi.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-[#F8FAFC] px-5 py-8 text-neutral-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0F766E]">Profil</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0F172A]">Edit Profil</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569]">
            Ubah data akunmu di halaman khusus edit profil. Username tidak dapat diubah di sini.
          </p>
        </div>
        <Link
          href="/dashboard/siswa/profil"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_0.6fr]">
        <div className="rounded-[32px] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Foto Profil</h2>
                  <p className="mt-1 text-sm text-[#64748B]">Bagikan avatar atau URL foto profil pilihanmu.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-slate-100 border border-slate-200">
                    <Image
                      src={avatarAsset}
                      alt="Preview avatar"
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                Nama Lengkap
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                  Username
                  <input
                    value={username}
                    readOnly
                    className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-[#64748B] outline-none"
                  />
                </label>
                <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                  Jenis Kelamin
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value as UserDocument['gender'] | '')}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                  Kelas
                  <select
                    value={classLevel}
                    onChange={(event) => setClassLevel(event.target.value as UserDocument['classLevel'] | '')}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
                  >
                    <option value="">Pilih kelas</option>
                    {CLASS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                  Biodata singkat
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={4}
                    placeholder="Ceritakan sedikit tentang dirimu"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 resize-none"
                  />
                </label>
              </div>

              <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                URL Avatar
                <input
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-[#334155]">
                URL Foto Profil
                <input
                  value={photoURL}
                  onChange={(event) => setPhotoURL(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/siswa/profil"
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#334155] transition hover:bg-slate-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSaving || !displayName.trim()}
                className="inline-flex items-center justify-center rounded-3xl bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F766E] disabled:opacity-60"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="rounded-[28px] bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-[#0F172A]">Ringkasan Profil</h2>
            <p className="mt-2 text-sm text-[#64748B]">Semua perubahan disimpan ke Firestore dan akan diperbarui saat kembali ke halaman profil.</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-[#334155]">
              <p className="font-semibold text-[#0F172A]">Nama Lengkap</p>
              <p className="mt-1">{displayName || '-'}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-[#334155]">
              <p className="font-semibold text-[#0F172A]">Username</p>
              <p className="mt-1">{username}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-[#334155]">
              <p className="font-semibold text-[#0F172A]">Jenis Kelamin</p>
              <p className="mt-1">{gender || '-'}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-[#334155]">
              <p className="font-semibold text-[#0F172A]">Kelas</p>
              <p className="mt-1">{classLevel || '-'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
