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

function parseComicIdFromStorageKey(storageKey: string | null): number | null {
  if (!storageKey || !storageKey.startsWith(COMIC_READING_PROGRESS_KEY_PREFIX)) {
    return null;
  }

  const comicId = Number(storageKey.slice(COMIC_READING_PROGRESS_KEY_PREFIX.length));
  return Number.isInteger(comicId) ? comicId : null;
}

function readLegacyProgressMap(storage: Storage): Record<number, StoredComicReadingProgress> {
  const legacyValue = storage.getItem(COMIC_READING_PROGRESS_STORAGE_KEY);
  if (!legacyValue) return {};

  try {
    const parsed = JSON.parse(legacyValue) as Record<string, StoredComicReadingProgress>;
    return Object.entries(parsed).reduce<Record<number, StoredComicReadingProgress>>((acc, [key, value]) => {
      const comicId = Number(key);
      if (!Number.isNaN(comicId)) {
        acc[comicId] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function getStoredComicReadingProgress(): Record<number, StoredComicReadingProgress> {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const progressByComic: Record<number, StoredComicReadingProgress> = {};
    const legacyProgress = readLegacyProgressMap(storage);

    for (let index = 0; index < storage.length; index += 1) {
      const storageKey = storage.key(index);
      if (storageKey === null) continue;

      const comicId = parseComicIdFromStorageKey(storageKey);
      if (comicId === null) continue;

      const value = storage.getItem(storageKey);
      if (!value) continue;

      try {
        const parsed = JSON.parse(value) as StoredComicReadingProgress;
        progressByComic[comicId] = parsed;
      } catch {
        // Ignore malformed entries
      }
    }

    if (Object.keys(progressByComic).length === 0 && Object.keys(legacyProgress).length > 0) {
      saveStoredComicReadingProgress(legacyProgress);
      return legacyProgress;
    }

    return progressByComic;
  } catch {
    return {};
  }
}

export function saveStoredComicReadingProgress(data: Record<number, StoredComicReadingProgress>): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const existingKey = storage.key(index);
      if (existingKey && existingKey.startsWith(COMIC_READING_PROGRESS_KEY_PREFIX)) {
        storage.removeItem(existingKey);
      }
    }

    storage.removeItem(COMIC_READING_PROGRESS_STORAGE_KEY);

    Object.values(data).forEach((value) => {
      if (!value || value.comicId === undefined) return;
      storage.setItem(getComicReadingProgressStorageKey(value.comicId), JSON.stringify(value));
    });
  } catch {
    // Ignore storage errors
  }
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
