"use client";

import Image from "next/image";
import Link from "next/link";
import { getComicById } from "@/lib/comicRepository";

interface ComicCoverProps {
  comicId: number;
}

export default function ComicCover({ comicId }: ComicCoverProps) {
  const comic = getComicById(comicId);

  if (!comic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Komik tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Back */}
      <div className="px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">
          ← Kembali
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        {/* Cover Image */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={comic.cover}
            alt={`Cover ${comic.title}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Judul */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">
            Kelas {comic.kelas} · {comic.lokasi}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-950 sm:text-3xl">
            {comic.title}
          </h1>
          <p className="mt-1 text-base text-neutral-500">{comic.subtitle}</p>
        </div>

        {/* Sinopsis */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Sinopsis
          </h2>
          <p className="mt-2 text-base leading-relaxed text-neutral-700">
            {comic.synopsis}
          </p>
        </section>

        {/* Profil Tokoh */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Profil Tokoh
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {comic.characters.map((char) => (
              <li key={char.name} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                  <Image
                    src={char.avatar}
                    alt={char.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{char.name}</p>
                  <p className="text-sm text-neutral-500">{char.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Target Pembelajaran */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Target Pembelajaran
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {comic.learningTargets.map((target, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-700">{target}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Tombol */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/comic/${comicId}`}
            className="flex-1 rounded-xl bg-primary-600 px-6 py-4 text-center text-base font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Mulai Belajar
          </Link>
          <button
            disabled
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-6 py-4 text-center text-base font-semibold text-neutral-400 shadow-sm cursor-not-allowed"
            title="Segera hadir"
          >
            Pretest
          </button>
        </div>
      </div>
    </main>
  );
}
