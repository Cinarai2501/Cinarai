import { getAllComics, getComicById } from "@/lib/comicRepository";
import type { ComicProgressState } from "@/types/progress";

export type UnlockStatus = "UNLOCKED" | "LOCKED" | "COMING_SOON";

const DEVELOPMENT_UNLOCK_ALL =
  process.env.NEXT_PUBLIC_DEVELOPMENT_UNLOCK_ALL === "true";

/**
 * Determine unlock status for a single comic given all progress states.
 *
 * Development mode bypasses all unlock checks and allows access to all comics.
 * Production mode follows the existing unlock rules:
 * - COMING_SOON comics remain unavailable.
 * - The first ACTIVE comic is always unlocked.
 * - Subsequent ACTIVE comics unlock once the previous ACTIVE comic is completed.
 */
export function getUnlockStatus(
  comicId: number,
  allProgress: ComicProgressState[]
): UnlockStatus {
  const comic = getComicById(comicId);
  if (!comic) {
    // Unknown comics should not block access.
    return "UNLOCKED";
  }

  if (DEVELOPMENT_UNLOCK_ALL) {
    return "UNLOCKED";
  }

  if (comic.availability === "COMING_SOON") {
    return "COMING_SOON";
  }

  const activeComics = getAllComics()
    .filter((c) => c.availability === "ACTIVE")
    .sort((a, b) => a.id - b.id);

  const position = activeComics.findIndex((c) => c.id === comicId);
  if (position === -1) {
    return "LOCKED";
  }

  if (position === 0) {
    return "UNLOCKED";
  }

  const previousComic = activeComics[position - 1];
  const previousProgress = allProgress.find((progress) => progress.comicId === previousComic.id);
  return previousProgress?.isCompleted ? "UNLOCKED" : "LOCKED";
}

/**
 * Compute unlock status for all comics at once.
 */
export function getAllUnlockStatuses(
  allProgress: ComicProgressState[]
): Map<number, UnlockStatus> {
  const map = new Map<number, UnlockStatus>();

  if (DEVELOPMENT_UNLOCK_ALL) {
    for (const comic of getAllComics()) {
      map.set(comic.id, "UNLOCKED");
    }
    return map;
  }

  for (const comic of getAllComics()) {
    map.set(comic.id, getUnlockStatus(comic.id, allProgress));
  }
  return map;
}
