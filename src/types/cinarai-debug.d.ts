declare global {
  interface Window {
    __cinaraiDebug?: {
      // From services/comicProgress
      resetComicProgress?: (userId: string, comicId: number) => Promise<unknown>;
      saveComicProgress?: (userId: string, comicId: number, state: unknown, extraData?: Record<string, unknown>) => Promise<void>;
      // From ComicReadingProgressContext
      triggerReadingProgressUpdate?: (comicId: number, page: number, totalPages: number) => void;
      triggerReadingProgressComplete?: (comicId: number, totalPages: number) => void;
      // From LearningEngineContext
      resetLearningEngineProgress?: () => Promise<void>;
    };
  }
}

export {};
