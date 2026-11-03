import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APPLICATION_ACTIVITY_OUTBOX_KEY,
  createApplicationActivityOutbox,
  type ApplicationActivityData,
  type ApplicationActivityOutboxDependencies,
  type ApplicationActivityOutboxStorage,
} from './applicationActivityOutbox';

class MemoryStorage implements ApplicationActivityOutboxStorage {
  readonly values = new Map<string, string>();
  failGet = false;
  failSet = false;

  get length() {
    return this.values.size;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  getItem(key: string) {
    if (this.failGet) throw new Error('storage unavailable');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failSet) throw new Error('storage full');
    this.values.set(key, value);
  }
}

function activity(userId: string | null = 'student-uid') {
  return {
    userId,
    data: {
      comicId: 2,
      selectedAnswer: 'Pilihan siswa',
      studentReason: 'Alasan siswa',
      attempt: 1,
      arViewed: false,
      explorationCompleted: false,
      localTimestamp: new Date(1_700_000_000_000).toISOString(),
    },
  };
}

function makeOutbox(
  overrides: Partial<ApplicationActivityOutboxDependencies> = {},
) {
  const storage = overrides.storage ?? new MemoryStorage();
  const writes: Array<{ id: string; userId: string; data: ApplicationActivityData }> = [];
  let nextId = 0;
  const outbox = createApplicationActivityOutbox({
    storage,
    isOnline: () => true,
    createId: () => `activity-${++nextId}`,
    writeDocument: async (id, userId, data) => {
      writes.push({ id, userId, data });
    },
    ...overrides,
  });
  return { outbox, storage, writes };
}

test('new activities are persisted in the local outbox', () => {
  const { outbox, storage } = makeOutbox();
  const result = outbox.enqueue(activity());

  assert.equal(result.persisted, true);
  assert.equal(result.identityAssociated, true);
  assert.equal(outbox.getPendingRecords().length, 1);
  assert.equal(JSON.parse(storage.getItem(APPLICATION_ACTIVITY_OUTBOX_KEY) ?? '[]').length, 1);
});

test('online activity is written to Firestore and removed only after acknowledgement', async () => {
  const { outbox, writes } = makeOutbox();
  const result = outbox.enqueue(activity());
  await outbox.sync('student-uid');

  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, result.id);
  assert.equal(writes[0].userId, 'student-uid');
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('offline activity remains queued and is automatically attempted when online', async () => {
  let online = false;
  const listeners: Array<() => void> = [];
  const { outbox, writes } = makeOutbox({
    isOnline: () => online,
    addResumeListeners: (callback) => {
      listeners.push(callback);
      return () => {};
    },
  });
  outbox.start('student-uid');
  outbox.enqueue(activity());
  await outbox.sync('student-uid');
  assert.equal(writes.length, 0);
  assert.equal(outbox.getPendingRecords().length, 1);

  online = true;
  listeners.forEach((listener) => listener());
  await outbox.sync('student-uid');
  assert.equal(writes.length, 1);
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('pending records survive service recreation and are resumed after reload', async () => {
  const storage = new MemoryStorage();
  const first = makeOutbox({ storage, isOnline: () => false });
  const saved = first.outbox.enqueue(activity());
  assert.equal(saved.persisted, true);

  const writes: string[] = [];
  const restored = createApplicationActivityOutbox({
    storage,
    isOnline: () => true,
    createId: () => 'unused',
    writeDocument: async (id) => { writes.push(id); },
  });
  restored.start('student-uid');
  await restored.sync('student-uid');

  assert.deepEqual(writes, [saved.id]);
  assert.equal(restored.getPendingRecords().length, 0);
});

test('retry uses the same Firestore document ID and does not create duplicates', async () => {
  let currentTime = 1_000;
  const attemptedIds: string[] = [];
  const documents = new Map<string, unknown>();
  let failOnce = true;
  const { outbox } = makeOutbox({
    now: () => currentTime,
    writeDocument: async (id, _userId, data) => {
      attemptedIds.push(id);
      if (failOnce) {
        failOnce = false;
        documents.set(id, data);
        throw Object.assign(new Error('temporary'), { code: 'unavailable' });
      }
      documents.set(id, data);
    },
  });
  const saved = outbox.enqueue(activity());
  await outbox.sync('student-uid');
  currentTime += 60_000;
  await outbox.sync('student-uid');
  await outbox.sync('student-uid');

  assert.deepEqual(attemptedIds, [saved.id, saved.id]);
  assert.equal(documents.size, 1);
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('temporary failures use one bounded exponential retry timer', async () => {
  let currentTime = 0;
  const scheduled: Array<{ callback: () => void; delay: number }> = [];
  let attempts = 0;
  const { outbox } = makeOutbox({
    now: () => currentTime,
    schedule: (callback, delay) => {
      scheduled.push({ callback, delay });
      return scheduled.length;
    },
    cancelScheduled: () => {},
    writeDocument: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw Object.assign(new Error('temporary'), { code: 'unavailable' });
      }
    },
  });
  outbox.enqueue(activity());
  outbox.start('student-uid');
  await outbox.sync('student-uid');
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 2_000);

  currentTime = scheduled[0].delay;
  scheduled[0].callback();
  await outbox.sync('student-uid');
  assert.equal(attempts, 2);
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('a different account cannot send or claim another account activity', async () => {
  const { outbox, writes } = makeOutbox({ isOnline: () => false });
  outbox.enqueue(activity('account-a'));
  await outbox.sync('account-b');

  assert.equal(writes.length, 0);
  assert.equal(outbox.getPendingRecords()[0].userId, 'account-a');
});

test('sync is skipped when Firebase Authentication reports a different current UID', async () => {
  const { outbox, writes } = makeOutbox({
    isOnline: () => true,
    isCurrentUser: () => false,
  });
  outbox.enqueue(activity('account-a'));
  await outbox.sync('account-a');

  assert.equal(writes.length, 0);
  assert.equal(outbox.getPendingRecords()[0].userId, 'account-a');
});

test('unassociated activity stays local and is never sent after another account logs in', async () => {
  const { outbox, writes } = makeOutbox({ isOnline: () => false });
  const result = outbox.enqueue(activity(null));
  outbox.start('account-b');
  await outbox.sync('account-b');

  assert.equal(result.identityAssociated, false);
  assert.equal(writes.length, 0);
  assert.equal(outbox.getPendingRecords()[0].userId, null);
});

test('the literal anonymous identity is rejected and cannot sync', async () => {
  const { outbox, writes } = makeOutbox();

  assert.throws(() => outbox.enqueue(activity('anonymous')), /Invalid application activity payload/);
  await outbox.sync('anonymous');

  assert.equal(writes.length, 0);
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('permission denied blocks automatic retries but preserves the outbox record', async () => {
  let attempts = 0;
  const listeners: Array<() => void> = [];
  const { outbox } = makeOutbox({
    writeDocument: async () => {
      attempts += 1;
      throw Object.assign(new Error('denied'), { code: 'permission-denied' });
    },
    addResumeListeners: (callback) => {
      listeners.push(callback);
      return () => {};
    },
  });
  outbox.enqueue(activity());
  outbox.start('student-uid');
  await outbox.sync('student-uid');
  listeners.forEach((listener) => listener());
  await outbox.sync('student-uid');

  assert.equal(attempts, 1);
  assert.equal(outbox.getPendingRecords()[0].blocked, true);
});

test('temporary retries stop after the configured attempt limit and retain the record', async () => {
  let currentTime = 0;
  const scheduled: Array<{ callback: () => void; delay: number }> = [];
  let attempts = 0;
  const { outbox } = makeOutbox({
    now: () => currentTime,
    schedule: (callback, delay) => {
      scheduled.push({ callback, delay });
      return scheduled.length;
    },
    cancelScheduled: () => {},
    writeDocument: async () => {
      attempts += 1;
      throw Object.assign(new Error('temporary'), { code: 'unavailable' });
    },
  });
  outbox.enqueue(activity());
  outbox.start('student-uid');
  await outbox.sync('student-uid');

  for (let retry = 0; retry < 7; retry += 1) {
    const timer = scheduled[scheduled.length - 1];
    if (!timer) break;
    currentTime += timer.delay;
    timer.callback();
    await outbox.sync('student-uid');
  }

  assert.equal(attempts, 8);
  assert.equal(outbox.getPendingRecords()[0].blocked, true);
});

test('corrupt local JSON is preserved and does not crash enqueue', () => {
  const storage = new MemoryStorage();
  storage.values.set(APPLICATION_ACTIVITY_OUTBOX_KEY, '{bad-json');
  const { outbox } = makeOutbox({ storage });
  const result = outbox.enqueue(activity());

  assert.equal(result.persisted, false);
  assert.equal(outbox.getPendingRecords().length, 1);
  assert.equal(storage.getItem(APPLICATION_ACTIVITY_OUTBOX_KEY), '{bad-json');
});

test('local storage write failures keep the activity in memory without throwing', () => {
  const storage = new MemoryStorage();
  storage.failSet = true;
  const { outbox } = makeOutbox({ storage });
  const result = outbox.enqueue(activity());

  assert.equal(result.persisted, false);
  assert.equal(outbox.getPendingRecords().length, 1);
});

test('legacy local activities are imported without deleting their original data', () => {
  const storage = new MemoryStorage();
  const legacyKey = 'cinarai.application.activity.2';
  storage.values.set(legacyKey, JSON.stringify([{
    userId: 'student-uid',
    comicId: 2,
    selectedAnswer: 'Jawaban',
    studentReason: 'Alasan',
    attempt: 1,
    arViewed: false,
    explorationCompleted: false,
    timestamp: new Date(1_700_000_000_000).toISOString(),
    synced: false,
  }]));
  const { outbox } = makeOutbox({ storage });

  assert.equal(outbox.getPendingRecords().length, 1);
  assert.equal(outbox.getPendingRecords()[0].userId, 'student-uid');
  assert.ok(storage.getItem(legacyKey));
});

test('activity is queued before AI Coach and synced after AI Coach fails', async () => {
  const { outbox, writes } = makeOutbox();
  outbox.start('student-uid');
  const sequence: string[] = [];
  const saved = outbox.enqueue({ ...activity(), deferSync: true });
  await outbox.sync('student-uid');
  assert.equal(writes.length, 0);

  sequence.push('activity-saved');
  await assert.rejects(async () => {
    sequence.push('ai-coach');
    throw new Error('AI Coach unavailable');
  }, /AI Coach unavailable/);
  outbox.release(saved.id, 'student-uid');
  await outbox.sync('student-uid');

  assert.deepEqual(sequence, ['activity-saved', 'ai-coach']);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, saved.id);
  assert.equal(writes[0].data.selectedAnswer, 'Pilihan siswa');
  assert.equal(outbox.getPendingRecords().length, 0);
});

test('deferred activity updates with real coach output before the first Firestore write', async () => {
  const { outbox, writes } = makeOutbox();
  outbox.start('student-uid');
  const saved = outbox.enqueue({ ...activity(), deferSync: true });
  outbox.update(saved.id, 'student-uid', {
    coachType: 'positive',
    coachMessage: 'Respons AI',
    coachSummary: { mastered: [], needsImprovement: [], nextPractice: [] },
  });

  await outbox.sync('student-uid');
  assert.equal(writes.length, 0);

  outbox.release(saved.id, 'student-uid');
  await outbox.sync('student-uid');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].data.coachMessage, 'Respons AI');
});

test('concurrent sync requests do not send the same record in parallel', async () => {
  let releaseWrite!: () => void;
  let writes = 0;
  const writeBarrier = new Promise<void>((resolve) => { releaseWrite = resolve; });
  const { outbox } = makeOutbox({
    writeDocument: async () => {
      writes += 1;
      await writeBarrier;
    },
  });
  outbox.enqueue(activity());
  const firstSync = outbox.sync('student-uid');
  const secondSync = outbox.sync('student-uid');
  releaseWrite();
  await Promise.all([firstSync, secondSync]);

  assert.equal(writes, 1);
  assert.equal(outbox.getPendingRecords().length, 0);
});
