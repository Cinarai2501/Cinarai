"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getComicById } from "@/lib/comicRepository";

// Loaded client-only: pdfjs-dist requires browser APIs (DOMMatrix, Canvas)
const PdfCoverCanvas = dynamic(() => import("./PdfCoverCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-lg bg-neutral-100"
      style={{ aspectRatio: "3 / 4" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-xs font-semibold text-neutral-400">Memuat cover...</p>
      </div>
    </div>
  ),
});

interface ComicCoverProps {
  comicId: number;
}

export default function ComicCover({ comicId }: ComicCoverProps) {
  const comic = getComicById(comicId);
  // Progress bar dihapus dari halaman Cover — state progress dikelola sepenuhnya
  // oleh LearningEngine (/comic/[id]/learn). Halaman ini hanya sebagai intro/preview.
  if (!comic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f7ff]">
        <div className="text-center px-6">
          <span className="text-5xl">📭</span>
          <p className="mt-3 text-base font-bold text-neutral-700">Komik tidak ditemukan.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-2xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f7ff] text-neutral-900">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-100 px-4 py-3 sm:px-6"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex-shrink-0"
            aria-label="Kembali ke dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm font-bold text-neutral-700 truncate">{comic.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 animate-fade-in-up">
        {/* Cover — PDF page 1 thumbnail, rendered client-side */}
        <PdfCoverCanvas pdfPath={comic.pdfPath} title={comic.title} />

        {/* Judul */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
              Kelas {comic.kelas}
            </span>
            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-700">
              📍 {comic.lokasi}
            </span>
          </div>
          <h1 className="text-2xl font-black text-neutral-950 sm:text-3xl leading-tight">
            {comic.title}
          </h1>
          <p className="mt-1.5 text-base text-neutral-500 leading-relaxed">{comic.subtitle}</p>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-bold text-neutral-600">Siap Belajar?</span>
          <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: '0%' }} />
          </div>
          <span className="text-sm font-black text-primary-600 flex-shrink-0">Mulai!</span>
        </div>

        {/* Sinopsis */}
        <section className="mt-6 rounded-3xl bg-white shadow-sm px-5 py-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Sinopsis
          </h2>
          <p className="text-sm leading-relaxed text-neutral-700">{comic.synopsis}</p>
        </section>

        {/* Profil Tokoh */}
        <section className="mt-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-3 px-1">
            Profil Tokoh
          </h2>
          <ul className="flex flex-col gap-2">
            {comic.characters.map((char) => (
              <li key={char.name} className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
                <AvatarImage src={char.avatar} name={char.name} />
                <div className="min-w-0">
                  <p className="font-bold text-neutral-900 leading-tight">{char.name}</p>
                  <p className="text-sm text-neutral-500 mt-0.5 leading-snug">{char.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Target Pembelajaran */}
        <section className="mt-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-3 px-1">
            Target Pembelajaran
          </h2>
          <ul className="flex flex-col gap-2">
            {comic.learningTargets.map((target, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed">{target}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Tombol */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/comic/${comicId}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
          >
            <span>▶</span> Mulai Belajar
          </Link>
          <button
            disabled
            className="flex-1 rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-400 cursor-not-allowed"
            title="Segera hadir"
          >
            Pretest
          </button>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// AvatarImage — shows initials when avatar image is missing
// ---------------------------------------------------------------------------
function AvatarImage({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (broken) {
    return (
      <div className="h-14 w-14 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
        <span className="text-sm font-bold text-primary-700">{initials}</span>
      </div>
    );
  }

  return (
    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
      <Image
        src={src}
        alt={name}
        fill
        sizes="56px"
        className="object-cover"
        onError={() => setBroken(true)}
      />
    </div>
  );
}
