'use client';

import Link from 'next/link';

export function GuruQuickActions() {
  return (
    <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Aksi Cepat</p>
          <h2 className="mt-1 text-xl font-black text-neutral-900">Kelola kelas Anda</h2>
        </div>
        <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">Realtime</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/guru/siswa"
          className="rounded-[20px] border border-neutral-100 bg-primary-50 px-4 py-4 text-left text-sm font-semibold text-primary-700 transition hover:border-primary-200 hover:bg-primary-100"
        >
          <p className="text-sm font-semibold">Lihat daftar siswa</p>
          <p className="mt-1 text-xs text-neutral-600">Pantau siswa dan progress mereka.</p>
        </Link>

        <Link
          href="/dashboard/guru/statistik"
          className="rounded-[20px] border border-neutral-100 bg-white px-4 py-4 text-left text-sm font-semibold text-neutral-900 transition hover:border-primary-200 hover:bg-primary-50"
        >
          <p className="text-sm font-semibold">Analisis kelas</p>
          <p className="mt-1 text-xs text-neutral-600">Lihat performa kelas dengan cepat.</p>
        </Link>

        <Link
          href="/dashboard/guru/analisis-ai"
          className="rounded-[20px] border border-neutral-100 bg-white px-4 py-4 text-left text-sm font-semibold text-neutral-900 transition hover:border-primary-200 hover:bg-primary-50"
        >
          <p className="text-sm font-semibold">AI Analytics</p>
          <p className="mt-1 text-xs text-neutral-600">Dapatkan insight pembelajaran AI.</p>
        </Link>

        <Link
          href="/dashboard/guru/laporan"
          className="rounded-[20px] border border-neutral-100 bg-white px-4 py-4 text-left text-sm font-semibold text-neutral-900 transition hover:border-primary-200 hover:bg-primary-50"
        >
          <p className="text-sm font-semibold">Buat laporan</p>
          <p className="mt-1 text-xs text-neutral-600">Siapkan laporan untuk pertemuan berikutnya.</p>
        </Link>
      </div>
    </section>
  );
}
