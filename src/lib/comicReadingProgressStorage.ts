export interface StoredComicReadingProgress {
  comicId: number;
  currentPage: number;
  totalPages: number;
  completed: boolean;
  lastPage: number;
}

export const COMIC_READING_PROGRESS_STORAGE_KEY = 'cinarai:comic-reading-progress';
export const COMIC_READING_PROGRESS_RESET_EVENT = 'cinarai:comic-reading-progress-reset';
const COMIC_READING_PROGRESS_KEY_PREFIX = 'comic-reader-comic-';

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function getComicReadingProgressStorageKey(comicId: number): string {
  return `${COMIC_READING_PROGRESS_KEY_PREFIX}${comicId}`;
}

export function getStoredComicReadingProgress(): Record<number, StoredComicReadingProgress> {
  return {};
}

export function saveStoredComicReadingProgress(_data: Record<number, StoredComicReadingProgress>): void {
  // Page-resume state is intentionally not persisted anymore.
  // Reading progress is still managed in memory for the current session.
}

export function clearStoredComicReadingProgressEntry(comicId: number): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(getComicReadingProgressStorageKey(comicId));
    const current = getStoredComicReadingProgress();
    delete current[comicId];
    saveStoredComicReadingProgress(current);
  } catch {
    // Ignore storage errors
  }
}

export function clearAllStoredComicReadingProgress(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const existingKey = storage.key(index);
      if (existingKey && (existingKey.startsWith(COMIC_READING_PROGRESS_KEY_PREFIX) || existingKey === COMIC_READING_PROGRESS_STORAGE_KEY)) {
        storage.removeItem(existingKey);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function dispatchComicReadingProgressReset(comicId?: number): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(COMIC_READING_PROGRESS_RESET_EVENT, {
      detail: comicId !== undefined ? { comicId } : undefined,
    })
  );
}
