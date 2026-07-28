'use client';

import Image from 'next/image';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
    return (
        <div className="space-y-4 pb-28">
            {/* ── Comic Header ── */}
            <section
                className="relative overflow-hidden rounded-[32px]"
                style={{
                    background: 'linear-gradient(135deg, #0DBF7E 0%, #0AA86E 40%, #0891B2 100%)',
                    minHeight: '180px',
                }}
            >
                {/* Decorative circle blobs */}
                <div
                    className="pointer-events-none absolute -top-8 -left-8 h-40 w-40 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)' }}
                />
                <div
                    className="pointer-events-none absolute -bottom-6 left-1/3 h-28 w-28 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)' }}
                />

                {/* Text content */}
                <div className="relative z-10 flex h-full items-center justify-between px-5 py-6">
                    <div className="flex-1 pr-4">
                        <p
                            className="text-[11px] font-bold uppercase tracking-[0.25em]"
                            style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                            Perpustakaan Komik
                        </p>
                        <h1
                            className="mt-1.5 text-[22px] font-black leading-tight"
                            style={{ color: '#FFFFFF' }}
                        >
                            Pilih Petualangan
                            <br />Belajarmu!
                        </h1>
                        <p
                            className="mt-2 text-[13px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.80)' }}
                        >
                            5 komik seru berbasis budaya Nusantara menantimu.
                        </p>
                    </div>

                    {/* Character illustration */}
                    <div className="relative flex-shrink-0" style={{ width: 110, height: 160 }}>
                        <Image
                            src="/comics/header/header-character.png"
                            alt="Karakter CINARAI"
                            fill
                            sizes="110px"
                            className="object-contain object-bottom drop-shadow-lg"
                            priority
                        />
                    </div>
                </div>
            </section>

            <LearningJourney />
        </div>
    );
}
