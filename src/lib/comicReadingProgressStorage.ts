export interface StoredComicReadingProgress {
  comicId: number;
  currentPage: number;
  totalPages: number;
  completed: boolean;
  lastPage: number;
}

export const COMIC_READING_PROGRESS_STORAGE_KEY = 'cinarai:comic-reading-progress';
export const COMIC_READING_PROGRESS_RESET_EVENT = 'cinarai:comic-reading-progress-reset';

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function getStoredComicReadingProgress(): Record<number, StoredComicReadingProgress> {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const stored = storage.getItem(COMIC_READING_PROGRESS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveStoredComicReadingProgress(data: Record<number, StoredComicReadingProgress>): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(COMIC_READING_PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredComicReadingProgressEntry(comicId: number): void {
  const storage = getStorage();
  if (!storage) return;

  try {
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
    storage.removeItem(COMIC_READING_PROGRESS_STORAGE_KEY);
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
