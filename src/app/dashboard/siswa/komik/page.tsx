'use client';

import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Daftar Komik</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Pilih komik dan lanjutkan petualanganmu</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Semua komik ditampilkan dalam kartu yang mudah dibaca di layar HP. Kamu bisa melihat progress, status, dan lanjut belajar dari sini.
        </p>
      </section>
      <LearningJourney />
    </div>
  );
}
