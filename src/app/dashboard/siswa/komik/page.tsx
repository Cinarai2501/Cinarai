'use client';

import Image from 'next/image';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1200px] bg-[#F8FAFC] pb-[88px] text-neutral-900">
      {/* 1. HEADER */}
      <section className="sticky top-0 z-40 w-full overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#0DBF7E] to-[#0AA86E] px-5 pb-6 pt-[max(20px,env(safe-area-inset-top))] text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-white">
              Daftar Komik
            </h1>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-white/90">
              Pilih komik untuk belajar dengan seru!
            </p>
          </div>

          <div className="relative h-[70px] w-[80px] shrink-0">
            <Image
              src="/comics/header/header-character.png"
              alt="Karakter CINARAI"
              fill
              sizes="80px"
              className="object-contain object-bottom drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT (Learning Journey with Search & Filters) */}
      <div className="px-5 pt-4">
        <LearningJourney />
      </div>
    </div>
  );
}
