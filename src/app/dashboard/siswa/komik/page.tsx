'use client';

import Image from 'next/image';
import DashboardPage from '@/components/dashboard/DashboardPage';
import LearningJourney from '@/components/dashboard/LearningJourney';

export default function DashboardSiswaKomikPage() {
  return (
    <DashboardPage
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
    >

      <LearningJourney />
    </DashboardPage>
  );
}
