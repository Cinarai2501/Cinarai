import { getAllComics, getComicById } from "@/lib/comicRepository";
import type { ComicProgressState } from "@/types/progress";

export type UnlockStatus = "UNLOCKED" | "LOCKED" | "COMING_SOON";

/**
 * Determine unlock status for a single comic given all progress states.
 * All active comics are unlocked as requested.
 */
export function getUnlockStatus(
  comicId: number,
  _allProgress: ComicProgressState[]
): UnlockStatus {
  const comic = getComicById(comicId);
  if (!comic) {
    return "UNLOCKED";
  }

  if (comic.availability === "COMING_SOON") {
    return "COMING_SOON";
  }

  return "UNLOCKED";
}

/**
 * Compute unlock status for all comics at once.
 */
export function getAllUnlockStatuses(
  allProgress: ComicProgressState[]
): Map<number, UnlockStatus> {
  const map = new Map<number, UnlockStatus>();
  for (const comic of getAllComics()) {
    map.set(comic.id, getUnlockStatus(comic.id, allProgress));
  }
  return map;
}
