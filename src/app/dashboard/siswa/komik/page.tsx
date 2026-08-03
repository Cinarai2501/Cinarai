'use client';

import Image from 'next/image';
import HeaderCard from '@/components/dashboard/HeaderCard';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
  return (
    <div className="min-h-0 w-full bg-[linear-gradient(180deg,#F5F8FF_0%,#F8FAFF_100%)] text-neutral-900">
      <HeaderCard
        title="Daftar Komik"
        subtitle="Pilih komik untuk belajar dengan seru!"
        gradientFrom="#0DBF7E"
        gradientTo="#0AA86E"
        rightContent={
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 ring-2 ring-white/50 shadow-md backdrop-blur-sm">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <Image
                src="/comics/header/header-character.png"
                alt="Karakter CINARAI"
                fill
                sizes="68px"
                className="object-contain object-bottom drop-shadow-sm"
                priority
              />
            </div>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-2 pt-5 sm:px-5 lg:px-6">
        <LearningJourney />
      </div>
    </div>
  );
}
