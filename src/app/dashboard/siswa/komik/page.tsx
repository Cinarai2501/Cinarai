'use client';

import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
    return (
        <div className="space-y-4 pb-28">
            <section className="rounded-[32px] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Komik</p>
                <h1 className="mt-3 text-2xl font-black text-neutral-900">Pilih materi belajar yang seru</h1>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">Semua komik ditampilkan dalam kartu modern. Lihat progress, status, dan lanjutkan belajarmu dengan cepat.</p>
            </section>
            <LearningJourney />
        </div>
    );
}
