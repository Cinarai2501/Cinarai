'use client';

import Image from 'next/image';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
    return (
        <div className="mx-auto max-w-[1200px] bg-[#F5F8FD] px-3 pb-28 sm:px-6 lg:px-8">
            {/* Header Section */}
            <section
                className="relative overflow-hidden rounded-[28px] px-5 py-6 sm:px-8 sm:py-7 text-white shadow-sm"
                style={{
                    background: 'linear-gradient(135deg, #0DBF7E 0%, #0AA86E 100%)',
                    minHeight: '140px',
                }}
            >
                <div className="relative z-10 flex h-full items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-3">
                        <h1 className="text-[28px] font-extrabold leading-tight text-white">
                            Daftar Komik
                        </h1>
                        <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/90">
                            Pilih komik untuk belajar dengan seru!
                        </p>
                    </div>

                    <div className="relative flex-shrink-0 h-[100px] w-[95px]">
                        <Image
                            src="/comics/header/header-character.png"
                            alt="Karakter CINARAI"
                            fill
                            sizes="95px"
                            className="object-contain object-bottom"
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* Learning Journey with Search & Filters */}
            <div className="mt-4 sm:mt-5">
                <LearningJourney />
            </div>
        </div>
    );
}
