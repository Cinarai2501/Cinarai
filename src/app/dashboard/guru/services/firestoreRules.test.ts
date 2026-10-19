import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

let testEnvironment: RulesTestEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-cinarai-rules',
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

after(async () => {
  await testEnvironment?.cleanup();
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

async function seedDashboardData() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const now = Timestamp.fromDate(new Date('2026-10-19T00:00:00.000Z'));
    await Promise.all([
      setDoc(doc(db, 'users', 'teacher-1'), {
        uid: 'teacher-1',
        email: 'teacher@example.test',
        role: 'teacher',
        isActive: true,
      }),
      setDoc(doc(db, 'users', 'student-1'), {
        uid: 'student-1',
        email: 'student@example.test',
        displayName: 'Siswa Satu',
        role: 'student',
        isActive: true,
      }),
      setDoc(doc(db, 'users', 'student-2'), {
        uid: 'student-2',
        email: 'student2@example.test',
        displayName: 'Siswa Dua',
        role: 'student',
        isActive: true,
      }),
      setDoc(doc(db, 'users', 'student-1', 'progress', 'comic-1'), {
        userId: 'student-1',
        comicId: 1,
        percentage: 25,
        status: 'in_progress',
      }),
      setDoc(doc(db, 'users', 'student-2', 'progress', 'comic-1'), {
        userId: 'student-2',
        comicId: 1,
        percentage: 50,
        status: 'in_progress',
      }),
      setDoc(doc(db, 'comics', 'comic-1'), { comicId: 1, order: 1 }),
      setDoc(doc(db, 'activity', 'activity-1'), { userId: 'student-1', occurredAt: now }),
      setDoc(doc(db, 'application_activity', 'application-1'), { userId: 'student-1', timestamp: now }),
      setDoc(doc(db, 'reflection', 'reflection-1'), { userId: 'student-1', createdAt: now }),
      setDoc(doc(db, 'identification_answers', 'identification-1'), { userId: 'student-1', updatedAt: now }),
    ]);
  });
}

test('a teacher with a trusted profile can read the dashboard student, progress, comic, and activity queries', async () => {
  await seedDashboardData();
  const db = testEnvironment.authenticatedContext('teacher-1').firestore();

  const students = await assertSucceeds(getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy('displayName', 'asc')
  )));
  assert.equal(students.size, 2);

  const progress = await assertSucceeds(getDocs(collection(db, 'users', 'student-1', 'progress')));
  assert.equal(progress.size, 1);
  assert.equal((await assertSucceeds(getDocs(query(collection(db, 'comics'), orderBy('order', 'asc'))))).size, 1);

  const recentQueries = [
    query(collection(db, 'activity'), orderBy('occurredAt', 'desc'), limit(20)),
    query(collection(db, 'application_activity'), orderBy('timestamp', 'desc'), limit(20)),
    query(collection(db, 'reflection'), orderBy('createdAt', 'desc'), limit(20)),
    query(collection(db, 'identification_answers'), orderBy('updatedAt', 'desc'), limit(20)),
  ];
  for (const recentQuery of recentQueries) {
    assert.equal((await assertSucceeds(getDocs(recentQuery))).size, 1);
  }
});

test('a signed-in student can read only their own profile and progress', async () => {
  await seedDashboardData();
  const db = testEnvironment.authenticatedContext('student-1').firestore();

  assert.equal((await assertSucceeds(getDoc(doc(db, 'users', 'student-1')))).exists(), true);
  assert.equal((await assertSucceeds(getDocs(collection(db, 'users', 'student-1', 'progress')))).size, 1);
  await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'progress', 'comic-2'), {
    userId: 'student-1',
    comicId: 2,
    percentage: 10,
    status: 'in_progress',
  }));
  await assertFails(getDoc(doc(db, 'users', 'student-2')));
  await assertFails(getDocs(collection(db, 'users', 'student-2', 'progress')));
  await assertFails(setDoc(doc(db, 'users', 'student-2', 'progress', 'comic-2'), {
    userId: 'student-1',
    comicId: 2,
    percentage: 10,
    status: 'in_progress',
  }));
});

test('unauthenticated users cannot read protected dashboard data', async () => {
  await seedDashboardData();
  const db = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(db, 'users', 'student-1')));
  await assertFails(getDocs(collection(db, 'users', 'student-1', 'progress')));
  await assertFails(getDocs(collection(db, 'activity')));
});

test('a teacher claim without a trusted profile cannot read dashboard data', async () => {
  await seedDashboardData();
  const db = testEnvironment.authenticatedContext('claim-only-teacher', { role: 'teacher' }).firestore();

  await assertFails(getDocs(query(collection(db, 'users'), where('role', '==', 'student'))));
});

test('self-service users can create student profiles but cannot assign themselves the teacher role', async () => {
  const db = testEnvironment.authenticatedContext('new-user').firestore();

  await assertSucceeds(setDoc(doc(db, 'users', 'new-user'), {
    uid: 'new-user',
    email: 'new-user@example.test',
    role: 'student',
    isActive: true,
  }));
  await assertFails(setDoc(doc(db, 'users', 'new-user'), {
    uid: 'new-user',
    email: 'new-user@example.test',
    role: 'teacher',
    isActive: true,
  }, { merge: true }));

  const selfAppointedTeacherDb = testEnvironment.authenticatedContext('self-appointed-teacher').firestore();
  await assertFails(setDoc(doc(selfAppointedTeacherDb, 'users', 'self-appointed-teacher'), {
    uid: 'self-appointed-teacher',
    email: 'attacker@example.test',
    role: 'teacher',
    isActive: true,
  }));
});
