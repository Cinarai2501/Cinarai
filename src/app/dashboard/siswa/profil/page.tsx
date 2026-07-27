'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardSiswaProfilPage() {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateUserProfile(displayName.trim(), photoURL.trim() || undefined);
      setStatus('Profil berhasil disimpan.');
    } catch (error) {
      setStatus('Tidak bisa menyimpan profil. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Profil</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Akun Siswa</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">Kelola nama, foto, dan data dasar akunmu. Perubahan hanya akan memengaruhi tampilan profil saja.</p>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50 text-3xl text-primary-700">
            {user?.displayName?.charAt(0).toUpperCase() ?? 'S'}
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">{user?.displayName ?? 'Nama Siswa'}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] bg-white p-5 shadow-sm">
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
    </div>
  );
}
