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
  query,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-cinarai-rules';
const STUDENTS = ['student-a', 'student-b'] as const;
let testEnvironment: RulesTestEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
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
  await seedFixtures();
});

async function seedFixtures() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const timestamp = Timestamp.fromDate(new Date('2026-10-28T00:00:00.000Z'));
    const fixtures = [
      setDoc(doc(db, 'users', 'teacher-1'), { uid: 'teacher-1', role: 'teacher' }),
      setDoc(doc(db, 'users', 'invalid-role-user'), { uid: 'invalid-role-user', role: 'instructor' }),
      ...STUDENTS.flatMap((uid, index) => [
        setDoc(doc(db, 'users', uid), {
          uid,
          role: 'student',
          displayName: `Student ${index + 1}`,
        }),
        setDoc(doc(db, 'users', uid, 'progress', 'comic-1'), {
          userId: uid,
          comicId: 1,
          currentStage: 'Identification',
          completedStages: ['Cover'],
        }),
        setDoc(doc(db, 'users', uid, 'progress', 'evaluation-cinarai'), {
          evaluationCinarai: { completed: true },
        }),
        setDoc(doc(db, 'identification_answers', `${uid}-identification`), {
          userId: uid,
          comicId: 1,
          step: 0,
          selectedAnswer: 'synthetic answer',
        }),
        setDoc(doc(db, 'reflection', `${uid}-reflection-user`), {
          userId: uid,
          stage: 'introspection',
          status: 'completed',
        }),
        setDoc(doc(db, 'reflection', `${uid}-reflection-student`), {
          studentId: uid,
          stage: 'introspection',
          status: 'completed',
        }),
        setDoc(doc(db, 'application_activity', `${uid}-activity-1`), {
          userId: uid,
          timestamp,
          attempt: 1,
        }),
        setDoc(doc(db, 'application_activity', `${uid}-activity-2`), {
          userId: uid,
          timestamp,
          attempt: 2,
        }),
      ]),
    ];
    await Promise.all(fixtures);
  });
}

test('trusted teacher can read each v2 query, including cursor pagination', async () => {
  const db = testEnvironment.authenticatedContext('teacher-1').firestore();

  const firstStudents = await assertSucceeds(getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    limit(2)
  )));
  assert.equal(firstStudents.size, 2);
  const studentCursorPage = await assertSucceeds(getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    startAfter(firstStudents.docs[0]),
    limit(2)
  )));
  assert.equal(studentCursorPage.size, 1);

  assert.equal((await assertSucceeds(getDocs(collection(db, 'users', 'student-a', 'progress')))).size, 2);
  assert.equal((await assertSucceeds(getDoc(
    doc(db, 'users', 'student-a', 'progress', 'evaluation-cinarai')
  ))).exists(), true);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'identification_answers'),
    where('userId', '==', 'student-a')
  )))).size, 1);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'reflection'),
    where('userId', '==', 'student-a')
  )))).size, 1);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'reflection'),
    where('studentId', '==', 'student-a')
  )))).size, 1);

  const firstActivities = await assertSucceeds(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-a'),
    limit(1)
  )));
  assert.equal(firstActivities.size, 1);
  const nextActivities = await assertSucceeds(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-a'),
    startAfter(firstActivities.docs[0]),
    limit(1)
  )));
  assert.equal(nextActivities.size, 1);
  assert.notEqual(nextActivities.docs[0].id, firstActivities.docs[0].id);
});

test('student can read own v2 data but cannot query or read another student data', async () => {
  const db = testEnvironment.authenticatedContext('student-a').firestore();
  assert.equal((await assertSucceeds(getDoc(doc(db, 'users', 'student-a')))).exists(), true);
  assert.equal((await assertSucceeds(getDocs(collection(db, 'users', 'student-a', 'progress')))).size, 2);
  assert.equal((await assertSucceeds(getDoc(
    doc(db, 'users', 'student-a', 'progress', 'evaluation-cinarai')
  ))).exists(), true);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'identification_answers'),
    where('userId', '==', 'student-a')
  )))).size, 1);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'reflection'),
    where('userId', '==', 'student-a')
  )))).size, 1);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'reflection'),
    where('studentId', '==', 'student-a')
  )))).size, 1);
  assert.equal((await assertSucceeds(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-a'),
    limit(1)
  )))).size, 1);

  await assertFails(getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    limit(2)
  )));
  await assertFails(getDoc(doc(db, 'users', 'student-b')));
  await assertFails(getDocs(collection(db, 'users', 'student-b', 'progress')));
  await assertFails(getDoc(doc(db, 'users', 'student-b', 'progress', 'evaluation-cinarai')));
  await assertFails(getDocs(query(
    collection(db, 'identification_answers'),
    where('userId', '==', 'student-b')
  )));
  await assertFails(getDocs(query(
    collection(db, 'reflection'),
    where('userId', '==', 'student-b')
  )));
  await assertFails(getDocs(query(
    collection(db, 'reflection'),
    where('studentId', '==', 'student-b')
  )));
  await assertFails(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-b'),
    limit(1)
  )));
});

test('unauthenticated users cannot access v2 student queries or documents', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDocs(query(collection(db, 'users'), where('role', '==', 'student'), limit(2))));
  await assertFails(getDocs(collection(db, 'users', 'student-a', 'progress')));
  await assertFails(getDoc(doc(db, 'users', 'student-a', 'progress', 'evaluation-cinarai')));
  await assertFails(getDocs(query(
    collection(db, 'identification_answers'),
    where('userId', '==', 'student-a')
  )));
  await assertFails(getDocs(query(collection(db, 'reflection'), where('userId', '==', 'student-a'))));
  await assertFails(getDocs(query(collection(db, 'reflection'), where('studentId', '==', 'student-a'))));
  await assertFails(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-a'),
    limit(1)
  )));
});

test('invalid profile role cannot use teacher list or cross-student queries', async () => {
  const db = testEnvironment.authenticatedContext('invalid-role-user').firestore();

  await assertFails(getDocs(query(collection(db, 'users'), where('role', '==', 'student'), limit(2))));
  await assertFails(getDocs(collection(db, 'users', 'student-a', 'progress')));
  await assertFails(getDoc(doc(db, 'users', 'student-a', 'progress', 'evaluation-cinarai')));
  await assertFails(getDocs(query(
    collection(db, 'identification_answers'),
    where('userId', '==', 'student-a')
  )));
  await assertFails(getDocs(query(collection(db, 'reflection'), where('userId', '==', 'student-a'))));
  await assertFails(getDocs(query(collection(db, 'reflection'), where('studentId', '==', 'student-a'))));
  await assertFails(getDocs(query(
    collection(db, 'application_activity'),
    where('userId', '==', 'student-a'),
    limit(1)
  )));
});
