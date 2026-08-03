'use client';

import Image from 'next/image';
import LearningJourney from '@/components/dashboard/LearningJourney';
import HeroHeader from '@/components/dashboard/HeroHeader';

export default function DashboardSiswaKomikPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1200px] bg-[#F8FAFC] pb-[88px] px-4 text-neutral-900 sm:px-5 lg:px-6">
      <HeroHeader
        title="Daftar Komik"
        subtitle="Pilih komik untuk belajar dengan seru!"
        gradientFrom="#0DBF7E"
        gradientTo="#0AA86E"
        rightContent={
          <div className="relative h-[72px] w-[80px] shrink-0">
            <Image
              src="/comics/header/header-character.png"
              alt="Karakter CINARAI"
              fill
              sizes="80px"
              className="object-contain object-bottom drop-shadow-sm"
              priority
            />
          </div>
        }
      />

      <div className="pt-4">
        <LearningJourney />
      </div>
    </div>
  );
}
