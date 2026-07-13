import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAllStoredComicReadingProgress,
  clearStoredComicReadingProgressEntry,
  COMIC_READING_PROGRESS_STORAGE_KEY,
  getStoredComicReadingProgress,
  saveStoredComicReadingProgress,
} from './comicReadingProgressStorage';

function createFakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

test('saves and reads progress for each comic under its own storage key', () => {
  const storage = createFakeStorage();
  (globalThis as typeof globalThis & { window: typeof window }).window = {
    localStorage: storage,
  } as unknown as Window & typeof globalThis;

  saveStoredComicReadingProgress({
    1: { comicId: 1, currentPage: 37, totalPages: 37, completed: true, lastPage: 37 },
    2: { comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 },
  });

  assert.equal(storage.getItem('comic-reader-comic-1'), JSON.stringify({ comicId: 1, currentPage: 37, totalPages: 37, completed: true, lastPage: 37 }));
  assert.equal(storage.getItem('comic-reader-comic-2'), JSON.stringify({ comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 }));
  assert.equal(storage.getItem(COMIC_READING_PROGRESS_STORAGE_KEY), null);
  assert.deepEqual(getStoredComicReadingProgress(), {
    1: { comicId: 1, currentPage: 37, totalPages: 37, completed: true, lastPage: 37 },
    2: { comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 },
  });
});

test('clearStoredComicReadingProgressEntry removes only the requested comic progress entry', () => {
  const storage = createFakeStorage();
  (globalThis as typeof globalThis & { window: typeof window }).window = {
    localStorage: storage,
  } as unknown as Window & typeof globalThis;

  saveStoredComicReadingProgress({
    1: { comicId: 1, currentPage: 37, totalPages: 37, completed: true, lastPage: 37 },
    2: { comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 },
  });

  clearStoredComicReadingProgressEntry(1);

  const stored = getStoredComicReadingProgress();
  assert.deepEqual(stored, {
    2: { comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 },
  });
  assert.equal(storage.getItem('comic-reader-comic-2'), JSON.stringify({ comicId: 2, currentPage: 4, totalPages: 10, completed: false, lastPage: 4 }));
  assert.equal(storage.getItem('comic-reader-comic-1'), null);
});

test('clearAllStoredComicReadingProgress removes the entire storage entry', () => {
  const storage = createFakeStorage();
  (globalThis as typeof globalThis & { window: typeof window }).window = {
    localStorage: storage,
  } as unknown as Window & typeof globalThis;

  saveStoredComicReadingProgress({
    1: { comicId: 1, currentPage: 3, totalPages: 10, completed: false, lastPage: 3 },
  });

  clearAllStoredComicReadingProgress();

  assert.deepEqual(getStoredComicReadingProgress(), {});
  assert.equal(storage.getItem(COMIC_READING_PROGRESS_STORAGE_KEY), null);
});
