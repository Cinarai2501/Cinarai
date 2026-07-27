'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardSiswaProfilPage() {
  const { user, updateUserProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateUserProfile(displayName.trim(), photoURL.trim() || undefined);
      setStatus('Profil berhasil disimpan.');
    } catch {
      setStatus('Tidak bisa menyimpan profil. Coba lagi.');
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
    <div className="space-y-4 pb-28">
      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-4xl text-primary-700">{user?.displayName?.charAt(0).toUpperCase() ?? 'S'}</div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Profil</p>
            <h1 className="mt-2 text-2xl font-black text-neutral-900">{user?.displayName ?? 'Nama Siswa'}</h1>
            <p className="mt-1 text-sm text-neutral-500">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900">Edit Profil</h2>
        <p className="mt-2 text-sm text-neutral-500">Perbarui nama dan foto yang muncul di aplikasi.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm font-semibold text-neutral-700">
            Nama lengkap
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="block space-y-2 text-sm font-semibold text-neutral-700">
            URL foto (opsional)
            <input
              value={photoURL}
              onChange={(event) => setPhotoURL(event.target.value)}
              className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          {status ? <p className="text-sm text-neutral-500">{status}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900">Pengaturan</h2>
        <div className="mt-4 grid gap-3">
          <Link href="/auth/forgot-password" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
            Ubah Password
          </Link>
          <button type="button" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left text-sm font-black text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
            Pengaturan
          </button>
          <button type="button" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left text-sm font-black text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
            Tentang Aplikasi
          </button>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900">Keluar</h2>
        <p className="mt-2 text-sm text-neutral-500">Logout dari akun kamu jika sudah selesai menggunakan aplikasi.</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          {isLoggingOut ? 'Keluar...' : 'Logout'}
        </button>
      </section>
    </div>
  );
}
