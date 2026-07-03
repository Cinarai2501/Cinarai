import { COMICS } from "@/data/comics";
import type { Comic, ComicProgress, ComicStage, ComicStatus } from "@/types/comic";

export function getAllComics(): Comic[] {
  return COMICS;
}

export function getComicById(id: number): Comic | undefined {
  return COMICS.find((c) => c.id === id);
}

export function getComicBySlug(slug: string): Comic | undefined {
  return COMICS.find((c) => c.slug === slug);
}

export function getTotalComics(): number {
  return COMICS.length;
}

/** Derive status from progress. First comic is always available. */
export function deriveComicStatus(
  comicId: number,
  allProgress: ComicProgress[]
): ComicStatus {
  const progress = allProgress.find((p) => p.comicId === comicId);
  if (progress) return progress.status;

  const comic = getComicById(comicId);
  if (!comic) return "locked";

  if (comicId === 1) return "available";

  const prev = allProgress.find((p) => p.comicId === comicId - 1);
  return prev?.status === "completed" ? "available" : "locked";
}

export function createInitialProgress(comicId: number): ComicProgress {
  const comic = getComicById(comicId);
  const firstStage: ComicStage = comic?.stages[0] ?? "comic";
  return {
    comicId,
    status: comicId === 1 ? "available" : "locked",
    currentStage: firstStage,
    completedStages: [],
    currentPage: 0,
    totalPages: 0,
    score: 0,
  };
}
