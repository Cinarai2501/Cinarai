'use client';

import Image from 'next/image';

interface StageHeroProps {
  cover: string;
  title: string;
  emoji: string;
  stageName: string;
  lokasi: string;
}

/**
 * Hero banner yang dipakai semua stage (kecuali Cover yang memakai gambar penuh).
 * Menampilkan cover komik dengan overlay gelap + judul stage di atasnya.
 */
export default function StageHero({ cover, title, emoji, stageName, lokasi }: StageHeroProps) {
  return (
    <div className="-mx-3 sm:mx-0">
      <div className="relative w-full overflow-hidden sm:rounded-2xl bg-neutral-200" style={{ aspectRatio: '16/7' }}>
        {/* Cover komik sebagai background */}
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 672px"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        {/* Teks di atas overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end px-5 pb-5 text-center">
          <span className="text-4xl mb-2 drop-shadow-lg">{emoji}</span>
          <h2 className="text-xl font-black text-white leading-snug drop-shadow-md">{stageName}</h2>
          <p className="mt-1 text-sm text-white/80 leading-snug">{lokasi}</p>
        </div>
      </div>
    </div>
  );
}
