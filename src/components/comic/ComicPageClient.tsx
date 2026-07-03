"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { getComicById } from "@/lib/comicRepository";
import { useComicProgress } from "@/hooks/useComicProgress";

const PdfReader = dynamic(() => import("./PdfReader"), { ssr: false });

interface ComicPageClientProps {
  comicId: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ComicPageClient({ comicId }: ComicPageClientProps) {
  const comic = getComicById(comicId);
  const router = useRouter();
  const { state, complete } = useComicProgress(comicId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // Prevent double-tap / double-fire
  const savingRef = useRef(false);

  const handleComplete = useCallback(async () => {
    // Already saved or in-flight — do nothing
    if (savingRef.current || state.isCompleted) return;

    // Contextualization is already completed — skip save, go straight to learn
    const contextualizationDone = state.sintaksList.some(
      (s) => s.sintaks === "Contextualization" && s.status === "COMPLETED"
    );
    if (contextualizationDone) {
      router.push(`/comic/${comicId}/learn`);
      return;
    }

    savingRef.current = true;
    setSaveStatus("saving");

    try {
      await complete("Contextualization");
      setSaveStatus("saved");
      router.push(`/comic/${comicId}/learn`);
    } catch {
      setSaveStatus("error");
      savingRef.current = false;
    }
  }, [state, complete, comicId, router]);

  if (!comic || comic.availability === "COMING_SOON") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f0f7ff] px-6 gap-5 text-center">
        <span className="text-6xl">🛠️</span>
        <div>
          <h2 className="text-xl font-black text-neutral-800">Segera Hadir!</h2>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            {comic?.subtitle ?? 'Komik ini sedang dalam persiapan.'}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          ← Kembali ke Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-900">
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white flex-shrink-0"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Kembali ke dashboard"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm font-semibold truncate text-gray-100">{comic.title}</span>
      </div>

      {/* Reader */}
      <div className="flex-1 min-h-0">
        {comic.pdfPath ? (
          <PdfReader
            pdfPath={comic.pdfPath}
            onComplete={handleComplete}
            showCompleteButton
            completeButtonLabel={
              saveStatus === "saving"
                ? "Menyimpan..."
                : saveStatus === "error"
                  ? "Gagal — Coba Lagi"
                  : "Selesaikan Komik"
            }
          />
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
