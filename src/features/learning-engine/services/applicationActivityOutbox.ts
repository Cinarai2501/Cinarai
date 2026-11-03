export interface ApplicationActivityData {
  comicId: number;
  selectedAnswer: string;
  studentReason: string;
  attempt: number;
  arViewed: boolean;
  explorationCompleted: boolean;
  localTimestamp: string;
  coachType?: string;
  coachMessage?: string;
  coachSummary?: {
    mastered: string[];
    needsImprovement: string[];
    nextPractice: string[];
  };
}

export interface ApplicationActivityOutboxRecord {
  id: string;
  userId: string | null;
  data: ApplicationActivityData;
  attempts: number;
  nextAttemptAt: number;
  blocked: boolean;
}

export interface ApplicationActivityInput {
  userId: string | null;
  data: ApplicationActivityData;
  deferSync?: boolean;
}

export interface ApplicationActivityOutboxStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  length?: number;
  key?(index: number): string | null;
}

export interface ApplicationActivityOutboxDependencies {
  storage?: ApplicationActivityOutboxStorage;
  isOnline: () => boolean;
  isCurrentUser?: (uid: string) => boolean;
  writeDocument: (id: string, userId: string, data: ApplicationActivityData) => Promise<void>;
  addResumeListeners?: (callback: () => void) => () => void;
  schedule?: (callback: () => void, delay: number) => unknown;
  cancelScheduled?: (handle: unknown) => void;
  now?: () => number;
  createId: () => string;
  onSyncError?: (category: 'temporary' | 'permanent' | 'retry_limit') => void;
}

export interface ApplicationActivitySaveResult {
  id: string;
  persisted: boolean;
  identityAssociated: boolean;
}

export const APPLICATION_ACTIVITY_OUTBOX_KEY = 'cinarai:application-activity-outbox-v1';
const LEGACY_KEY_PREFIX = 'cinarai.application.activity.';
const MAX_RETRIES = 8;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function validSummary(value: unknown): value is ApplicationActivityData['coachSummary'] {
  if (!isRecord(value) || !hasOnlyKeys(value, ['mastered', 'needsImprovement', 'nextPractice'])) return false;
  return ['mastered', 'needsImprovement', 'nextPractice'].every((key) => {
    const items = value[key];
    return Array.isArray(items) && items.every((item: unknown) => typeof item === 'string');
  });
}

function validData(value: unknown): value is ApplicationActivityData {
  if (!isRecord(value)
    || !hasOnlyKeys(value, [
      'comicId', 'selectedAnswer', 'studentReason', 'attempt', 'arViewed',
      'explorationCompleted', 'localTimestamp', 'coachType', 'coachMessage', 'coachSummary',
    ])
    || !Number.isSafeInteger(value.comicId) || Number(value.comicId) < 1
    || typeof value.selectedAnswer !== 'string'
    || !value.selectedAnswer.trim()
    || typeof value.studentReason !== 'string'
    || !Number.isSafeInteger(value.attempt) || Number(value.attempt) < 1
    || typeof value.arViewed !== 'boolean'
    || typeof value.explorationCompleted !== 'boolean'
    || typeof value.localTimestamp !== 'string'
    || !Number.isFinite(Date.parse(value.localTimestamp))) {
    return false;
  }
  if (value.coachType !== undefined && typeof value.coachType !== 'string') return false;
  if (value.coachMessage !== undefined && typeof value.coachMessage !== 'string') return false;
  return value.coachSummary === undefined || validSummary(value.coachSummary);
}

function validRecord(value: unknown): value is ApplicationActivityOutboxRecord {
  return isRecord(value)
    && hasOnlyKeys(value, ['id', 'userId', 'data', 'attempts', 'nextAttemptAt', 'blocked'])
    && typeof value.id === 'string'
    && /^[A-Za-z0-9_-]{1,120}$/.test(value.id)
    && (value.userId === null || (
      typeof value.userId === 'string'
      && value.userId.length > 0
      && value.userId !== 'anonymous'
      && value.userId.trim() === value.userId
    ))
    && validData(value.data)
    && Number.isSafeInteger(value.attempts)
    && Number(value.attempts) >= 0
    && typeof value.nextAttemptAt === 'number'
    && Number.isFinite(value.nextAttemptAt)
    && typeof value.blocked === 'boolean';
}

function errorCode(error: unknown): string | null {
  if (!isRecord(error) || typeof error.code !== 'string') return null;
  return error.code.toLowerCase().replace(/^firestore\//, '');
}

function isTemporaryError(error: unknown): boolean {
  const code = errorCode(error);
  if (!code) return true;
  return TEMPORARY_ERROR_CODES.has(code);
}

const TEMPORARY_ERROR_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'aborted',
  'internal',
  'resource-exhausted',
  'network-request-failed',
  'unknown',
]);

function legacyId(key: string, index: number, value: Record<string, unknown>): string {
  const input = `${key}:${index}:${JSON.stringify(value)}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const comicId = Number(key.slice(LEGACY_KEY_PREFIX.length));
  return `legacy-${comicId}-${index}-${(hash >>> 0).toString(36)}`;
}

function fromLegacyRecord(
  key: string,
  index: number,
  value: unknown,
): ApplicationActivityOutboxRecord | null {
  if (!isRecord(value) || value.synced !== false) return null;
  const comicId = Number(key.slice(LEGACY_KEY_PREFIX.length));
  const userId = typeof value.userId === 'string' && value.userId !== 'anonymous'
    ? value.userId.trim() || null
    : null;
  const data = {
    comicId,
    selectedAnswer: value.selectedAnswer,
    studentReason: value.studentReason,
    attempt: value.attempt,
    arViewed: value.arViewed,
    explorationCompleted: value.explorationCompleted,
    localTimestamp: value.timestamp,
    ...(typeof value.coachType === 'string' ? { coachType: value.coachType } : {}),
    ...(typeof value.coachMessage === 'string' ? { coachMessage: value.coachMessage } : {}),
    ...(validSummary(value.coachSummary) ? { coachSummary: value.coachSummary } : {}),
  };
  if (!validData(data)) return null;
  return {
    id: legacyId(key, index, value),
    userId,
    data,
    attempts: 0,
    nextAttemptAt: 0,
    blocked: false,
  };
}

export function createApplicationActivityOutbox(dependencies: ApplicationActivityOutboxDependencies) {
  const records = new Map<string, ApplicationActivityOutboxRecord>();
  const knownRecords = new Map<string, ApplicationActivityOutboxRecord>();
  const deferredIds = new Set<string>();
  let storageWritable = Boolean(dependencies.storage);
  let flushPromise: Promise<void> | null = null;
  let retryHandle: unknown;
  let activeUid: string | null = null;
  let activeSession: object | null = null;
  const now = dependencies.now ?? Date.now;
  const schedule = dependencies.schedule ?? ((callback, delay) => setTimeout(callback, delay));
  const cancelScheduled = dependencies.cancelScheduled ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  const persist = (): boolean => {
    if (!dependencies.storage || !storageWritable) return false;
    try {
      dependencies.storage.setItem(APPLICATION_ACTIVITY_OUTBOX_KEY, JSON.stringify(Array.from(records.values())));
      return true;
    } catch {
      storageWritable = false;
      return false;
    }
  };

  const loadOutbox = () => {
    if (!dependencies.storage) return;
    try {
      const raw = dependencies.storage.getItem(APPLICATION_ACTIVITY_OUTBOX_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          storageWritable = false;
          return;
        }
        for (const candidate of parsed) {
          if (!validRecord(candidate)) {
            storageWritable = false;
            continue;
          }
          records.set(candidate.id, candidate);
          knownRecords.set(candidate.id, candidate);
        }
      }
    } catch {
      storageWritable = false;
    }
  };

  const importLegacyRecords = () => {
    const storage = dependencies.storage;
    if (!storage || !storageWritable) return;
    const legacyEntries: Array<{ key: string; raw: string }> = [];
    try {
      if (typeof storage.length !== 'number' || !storage.key) return;
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith(LEGACY_KEY_PREFIX)) continue;
        const comicId = Number(key.slice(LEGACY_KEY_PREFIX.length));
        if (!Number.isSafeInteger(comicId) || comicId < 1) continue;
        const raw = storage.getItem(key);
        if (raw) legacyEntries.push({ key, raw });
      }
    } catch {
      storageWritable = false;
      return;
    }

    let imported = false;
    for (const { key, raw } of legacyEntries) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        parsed.forEach((value, index) => {
          const record = fromLegacyRecord(key, index, value);
          if (!record || records.has(record.id)) return;
          records.set(record.id, record);
          knownRecords.set(record.id, record);
          imported = true;
        });
      } catch {
        continue;
      }
    }
    if (imported) persist();
  };

  loadOutbox();
  importLegacyRecords();

  const scheduleNextRetry = (uid: string) => {
    if (retryHandle !== undefined) cancelScheduled(retryHandle);
    retryHandle = undefined;
    if (!dependencies.isOnline()) return;
    const next = Array.from(records.values())
      .filter((record) => record.userId === uid
        && !deferredIds.has(record.id)
        && !record.blocked
        && record.attempts < MAX_RETRIES)
      .reduce<number | null>((soonest, record) =>
        soonest === null || record.nextAttemptAt < soonest ? record.nextAttemptAt : soonest, null);
    if (next === null) return;
    retryHandle = schedule(() => {
      retryHandle = undefined;
      void sync(uid);
    }, Math.max(0, next - now()));
  };

  const sync = (uid: string): Promise<void> => {
    if (!uid
      || uid === 'anonymous'
      || !dependencies.isOnline()
      || (activeUid !== null && activeUid !== uid)
      || (dependencies.isCurrentUser && !dependencies.isCurrentUser(uid))) {
      return Promise.resolve();
    }
    if (flushPromise) return flushPromise;

    flushPromise = (async () => {
      for (const record of Array.from(records.values())) {
        if ((activeUid !== null && activeUid !== uid)
          || (dependencies.isCurrentUser && !dependencies.isCurrentUser(uid))) break;
        if (record.userId !== uid
          || deferredIds.has(record.id)
          || record.blocked
          || record.attempts >= MAX_RETRIES) continue;
        if (record.nextAttemptAt > now()) continue;
        try {
          await dependencies.writeDocument(record.id, uid, record.data);
          const current = records.get(record.id);
          if (current === record) {
            records.delete(record.id);
          }
          if (current) knownRecords.set(record.id, current);
          persist();
        } catch (error) {
          const current = records.get(record.id) ?? record;
          if (!isTemporaryError(error)) {
            const blocked = { ...current, blocked: true };
            records.set(record.id, blocked);
            knownRecords.set(record.id, blocked);
            persist();
            dependencies.onSyncError?.('permanent');
            continue;
          }
          const attempts = current.attempts + 1;
          const blocked = attempts >= MAX_RETRIES;
          const delay = Math.min(1000 * (2 ** attempts), MAX_RETRY_DELAY_MS);
          const failed = {
            ...current,
            attempts,
            nextAttemptAt: blocked ? 0 : now() + delay,
            blocked,
          };
          records.set(record.id, failed);
          knownRecords.set(record.id, failed);
          persist();
          dependencies.onSyncError?.(blocked ? 'retry_limit' : 'temporary');
        }
      }
    })().finally(() => {
      flushPromise = null;
      if (activeUid) scheduleNextRetry(activeUid);
    });
    return flushPromise;
  };

  const enqueue = (input: ApplicationActivityInput): ApplicationActivitySaveResult => {
    if ((input.userId !== null
      && (!input.userId.trim() || input.userId.trim() !== input.userId || input.userId === 'anonymous'))
      || !validData(input.data)) {
      throw new Error('Invalid application activity payload.');
    }
    const id = dependencies.createId();
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(id) || records.has(id) || knownRecords.has(id)) {
      throw new Error('Unable to allocate a unique application activity ID.');
    }
    const record: ApplicationActivityOutboxRecord = {
      id,
      userId: input.userId,
      data: input.data,
      attempts: 0,
      nextAttemptAt: 0,
      blocked: false,
    };
    records.set(record.id, record);
    knownRecords.set(record.id, record);
    if (input.deferSync) deferredIds.add(record.id);
    const persisted = persist();
    if (!input.deferSync && record.userId && activeUid === record.userId) void sync(record.userId);
    return { id: record.id, persisted, identityAssociated: Boolean(record.userId) };
  };

  const update = (
    id: string,
    userId: string | null,
    patch: Partial<Pick<ApplicationActivityData, 'coachType' | 'coachMessage' | 'coachSummary'>>,
  ): ApplicationActivitySaveResult => {
    const previous = knownRecords.get(id);
    if (!previous || previous.userId !== userId) {
      return { id, persisted: false, identityAssociated: false };
    }
    const record: ApplicationActivityOutboxRecord = {
      ...previous,
      data: { ...previous.data, ...patch },
      attempts: 0,
      nextAttemptAt: 0,
      blocked: false,
    };
    if (!validData(record.data)) throw new Error('Invalid application activity update.');
    records.set(id, record);
    knownRecords.set(id, record);
    const persisted = persist();
    if (!deferredIds.has(record.id) && record.userId && activeUid === record.userId) {
      void sync(record.userId);
    }
    return { id, persisted, identityAssociated: Boolean(record.userId) };
  };

  const release = (id: string, userId: string | null): void => {
    const record = records.get(id);
    if (!record || !userId || record.userId !== userId || !deferredIds.has(id)) return;
    deferredIds.delete(id);
    if (activeUid === userId) void sync(userId);
  };

  const start = (uid: string): (() => void) => {
    const session = {};
    activeSession = session;
    activeUid = uid || null;
    if (!uid) return () => {};
    void sync(uid);
    const removeListeners = dependencies.addResumeListeners?.(() => {
      if (activeSession === session && activeUid === uid) void sync(uid);
    });
    return () => {
      removeListeners?.();
      if (activeSession === session) {
        activeSession = null;
        activeUid = null;
      }
      if (activeSession === null && retryHandle !== undefined) {
        cancelScheduled(retryHandle);
        retryHandle = undefined;
      }
    };
  };

  return {
    enqueue,
    update,
    release,
    start,
    sync,
    getPendingRecords: () => Array.from(records.values()).map((record) => ({ ...record })),
  };
}
