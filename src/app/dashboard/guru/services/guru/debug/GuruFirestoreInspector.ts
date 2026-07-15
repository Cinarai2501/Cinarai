type InspectorWhereClause = {
  field: string;
  op: string;
  value: unknown;
};

type InspectorOrderByClause = {
  field: string;
  direction: 'asc' | 'desc';
};

export type GuruFirestoreInspectorEntry = {
  id: string;
  collection: string;
  path: string;
  where: InspectorWhereClause[];
  orderBy: InspectorOrderByClause[];
  limit: number | null;
  status: 'SUCCESS' | 'FAILED';
  documentCount: number | null;
  durationMs: number;
  errorCode: string | null;
  errorMessage: string | null;
  timestamp: string;
};

export type GuruFirestoreInspectorListener = (entries: GuruFirestoreInspectorEntry[]) => void;

export type GuruFirestoreQueryConfig = {
  collection: string;
  path: string;
  where?: InspectorWhereClause[];
  orderBy?: InspectorOrderByClause[];
  limit?: number | null;
};

class GuruFirestoreInspectorImpl {
  private static instance: GuruFirestoreInspectorImpl | null = null;
  private entries: GuruFirestoreInspectorEntry[] = [];
  private listeners = new Set<GuruFirestoreInspectorListener>();

  static getInstance(): GuruFirestoreInspectorImpl {
    if (!GuruFirestoreInspectorImpl.instance) {
      GuruFirestoreInspectorImpl.instance = new GuruFirestoreInspectorImpl();
    }

    return GuruFirestoreInspectorImpl.instance;
  }

  subscribe(listener: GuruFirestoreInspectorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getEntries(): GuruFirestoreInspectorEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.emit();
  }

  record(entry: GuruFirestoreInspectorEntry): void {
    this.entries = [entry, ...this.entries].slice(0, 50);
    this.emit();
  }

  async run<T>(config: GuruFirestoreQueryConfig, executor: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();

    try {
      const result = await executor();
      const documentCount = this.getDocumentCount(result);
      this.record({
        id: `${config.collection}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        collection: config.collection,
        path: config.path,
        where: config.where ?? [],
        orderBy: config.orderBy ?? [],
        limit: config.limit ?? null,
        status: 'SUCCESS',
        documentCount,
        durationMs: Date.now() - startedAt,
        errorCode: null,
        errorMessage: null,
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      const normalized = this.normalizeError(error);
      this.record({
        id: `${config.collection}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        collection: config.collection,
        path: config.path,
        where: config.where ?? [],
        orderBy: config.orderBy ?? [],
        limit: config.limit ?? null,
        status: 'FAILED',
        documentCount: null,
        durationMs: Date.now() - startedAt,
        errorCode: normalized.code,
        errorMessage: normalized.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  private getDocumentCount(result: unknown): number | null {
    if (Array.isArray(result)) {
      return result.length;
    }

    if (result && typeof result === 'object') {
      const snapshot = result as { docs?: Array<unknown> };
      if (Array.isArray(snapshot.docs)) {
        return snapshot.docs.length;
      }
    }

    return null;
  }

  private normalizeError(error: unknown): { code: string; message: string } {
    if (error instanceof Error) {
      return {
        code: 'unknown',
        message: error.message,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const maybeCode = (error as { code?: unknown }).code;
      const maybeMessage = (error as { message?: unknown }).message;
      return {
        code: typeof maybeCode === 'string' ? maybeCode : 'unknown',
        message: typeof maybeMessage === 'string' ? maybeMessage : 'Unknown Firestore error',
      };
    }

    return {
      code: 'unknown',
      message: 'Unknown Firestore error',
    };
  }

  private emit(): void {
    const snapshot = this.getEntries();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const GuruFirestoreInspector = GuruFirestoreInspectorImpl.getInstance();
export function getGuruFirestoreInspectorEntries(): GuruFirestoreInspectorEntry[] {
  return GuruFirestoreInspector.getEntries();
}
