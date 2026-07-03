'use client';

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { getAllComics } from "@/lib/comicRepository";
import { getAllUnlockStatuses } from "@/lib/unlockEngine";
import { useAllComicProgress } from "@/hooks/useAllComicProgress";

const comics = getAllComics();

export default function LearningJourney() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  useEffect(() => {
    console.log('[Dashboard] Firestore User Loaded');
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log('[Dashboard] Learning Journey Loaded', { comicCount: comics.length, progressCount: states.length });
    }
  }, [isLoading, states]);

  if (isLoading) {
    return (
      <section className="rounded-base border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <div className="h-4 w-28 rounded bg-neutral-200 animate-pulse" />
          <div className="mt-2 h-6 w-40 rounded bg-neutral-200 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-24 rounded-base bg-neutral-200 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-base border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-neutral-500">Learning Journey</p>
        <h2 className="mt-1 text-xl font-bold text-neutral-950">Timeline komik</h2>
      </div>

      <div className="space-y-0">
        {comics.map((comic, index) => {
          const isLast = index === comics.length - 1;
          const progress = getProgress(comic.id);
          const percentage = progress?.percentage ?? 0;
          const isCompleted = progress?.isCompleted ?? false;
          const unlockStatus = unlockStatuses.get(comic.id) ?? "LOCKED";
          const isLocked = unlockStatus === "LOCKED";
          const isComingSoonStatus = unlockStatus === "COMING_SOON";

          return (
            <article className="relative flex gap-4" key={comic.id}>
              {/* Timeline marker */}
              <div className="flex w-10 flex-col items-center">
                <div
                  className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isComingSoonStatus || isLocked
                      ? "border-neutral-300 bg-neutral-100 text-neutral-400"
                      : isCompleted
                        ? "border-accent-500 bg-accent-500 text-white"
                        : "border-primary-600 bg-white text-primary-700"
                  }`}
                >
                  {index + 1}
                </div>
                {!isLast && (
                  <div className="flex min-h-12 flex-1 flex-col items-center justify-center py-2">
                    <div className="h-full w-px bg-neutral-200" />
                    <span className="text-sm font-bold text-neutral-300">↓</span>
                  </div>
                )}
              </div>

              {/* Card */}
              <div
                className={`mb-4 flex-1 rounded-base border p-4 ${
                  isComingSoonStatus || isLocked
                    ? "border-neutral-200 bg-neutral-50"
                    : isCompleted
                      ? "border-accent-200 bg-accent-50"
                      : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold ${isComingSoonStatus || isLocked ? "text-neutral-400" : "text-neutral-900"}`}>
                        {comic.title}
                      </h3>
                      {isComingSoonStatus && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Sedang Dikembangkan
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
                          Terkunci
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                          Selesai
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 text-sm ${isComingSoonStatus || isLocked ? "text-neutral-400" : "text-neutral-500"}`}>
                      {comic.subtitle} · Kelas {comic.kelas}
                    </p>
                  </div>
                  {!isComingSoonStatus && !isLocked && (
                    <span className="text-sm font-bold text-neutral-500">{percentage}%</span>
                  )}
                </div>

                {/* Progress bar */}
                {!isComingSoonStatus && !isLocked && (
                  <div className="mt-3 h-1.5 rounded-full bg-white">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-accent-500" : "bg-primary-600"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}

                <div className="mt-3">
                  {isComingSoonStatus || isLocked ? (
                    <button
                      disabled
                      className="rounded-lg bg-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-400 cursor-not-allowed"
                    >
                      Masuk
                    </button>
                  ) : (
                    <Link
                      href={`/comic/${comic.id}/cover`}
                      className="inline-block rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Masuk
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
