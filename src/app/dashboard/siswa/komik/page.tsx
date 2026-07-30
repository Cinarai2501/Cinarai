'use client';

import Image from 'next/image';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
    return (
        <div className="space-y-4 pb-28">
            <section
                className="relative overflow-hidden rounded-[28px] px-5 py-4"
                style={{
                    background: 'linear-gradient(135deg, #0DBF7E 0%, #0AA86E 40%, #0891B2 100%)',
                    minHeight: '128px',
                }}
            >
                <div
                    className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)' }}
                />
                <div
                    className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)' }}
                />

                <div className="relative z-10 flex h-full items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
                            Perpustakaan Komik
                        </p>
                        <h1 className="mt-2 text-[22px] font-black leading-[28px] text-white">
                            Pilih petualanganmu.
                        </h1>
                        <p className="mt-2 text-[12px] leading-[18px] text-white/90">
                            5 komik seru berbasis budaya Nusantara menantimu.
                        </p>
                    </div>

                    <div className="relative flex-shrink-0 h-[118px] w-[90px]">
                        <Image
                            src="/comics/header/header-character.png"
                            alt="Karakter CINARAI"
                            fill
                            sizes="90px"
                            className="object-contain object-bottom"
                            priority
                        />
                    </div>
                </div>
            </section>

            <LearningJourney />
        </div>
    );
}
