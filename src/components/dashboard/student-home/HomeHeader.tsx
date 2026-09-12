'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AppLogo } from '@/components/ui/AppLogo';

type HomeHeaderProps = {
  firstName: string;
  avatarAsset: string;
};

export default function HomeHeader({ firstName, avatarAsset }: HomeHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 bg-white px-4 py-3.5 sm:px-5">
      <Link href="/dashboard/siswa/home" className="flex min-w-0 items-center gap-2.5">
        <AppLogo variant="header" priority className="h-12 w-[52px] object-contain" />
        <span className="min-w-0">
          <span className="block text-[18px] font-extrabold leading-none tracking-[-0.03em] text-[#12366A]">CINARAI</span>
          <span className="mt-1 block whitespace-nowrap text-[8px] font-semibold leading-none text-[#60728D]">Critical Numeracy with AR &amp; AI</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" aria-label="Notifikasi" className="relative grid h-10 w-10 place-items-center rounded-full bg-[#F7FAFF] text-[#18365F] shadow-sm ring-1 ring-[#E7EEF8]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" />
          </svg>
          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#F04468]" />
        </button>
        <Link href="/dashboard/siswa/profil" aria-label={`Profil ${firstName}`} className="relative h-10 w-10 overflow-hidden rounded-full bg-[#E8F0FA] ring-1 ring-[#DDE8F5]">
          <Image src={avatarAsset} alt={`${firstName} avatar`} fill sizes="40px" className="object-cover" />
        </Link>
      </div>
    </header>
  );
}
