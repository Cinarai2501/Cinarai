"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { getComicById } from "@/lib/comicRepository";

const PdfReader = dynamic(() => import("./PdfReader"), { ssr: false });

interface ComicPageClientProps {
  comicId: number;
}

export default function ComicPageClient({ comicId }: ComicPageClientProps) {
  const comic = getComicById(comicId);

  if (!comic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Komik tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white flex-shrink-0">
        <Link
          href="/dashboard"
          className="text-sm text-gray-300 hover:text-white"
          aria-label="Kembali ke dashboard"
        >
          ← Kembali
        </Link>
        <span className="text-gray-500">|</span>
        <span className="text-sm font-medium truncate">{comic.title}</span>
      </div>

      {/* Reader */}
      <div className="flex-1 min-h-0">
        {comic.pdfPath ? (
          <PdfReader pdfPath={comic.pdfPath} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white py-20">
            <p className="text-lg font-semibold">Coming Soon</p>
            <p className="text-sm text-gray-400">{comic.subtitle}</p>
          </div>
        )}
      </div>
    </main>
  );
}
