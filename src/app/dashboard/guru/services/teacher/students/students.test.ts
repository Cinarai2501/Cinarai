import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudentDirectoryRows } from './students';
import type { UserDocument, ComicProgressDocument } from '@/types/firestore';

test('buildStudentDirectoryRows creates summaries for students', () => {
  const users: UserDocument[] = [
    {
      uid: 'student-1',
      email: 'student1@example.com',
      displayName: 'Ayu Pratiwi',
      role: 'student',
      gradeLevel: 8,
      isActive: true,
      lastLoginAt: undefined,
    },
  ];

  const progressDocuments: ComicProgressDocument[] = [
    {
      id: 'progress-1',
      comicId: 1,
      completedStage: 'resolution',
      completedPages: 10,
      percentage: 100,
      status: 'completed',
      sintaksList: [],
      updatedAt: undefined as never,
    },
  ];

  const rows = buildStudentDirectoryRows(users, progressDocuments, []);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, 'Ayu Pratiwi');
  assert.equal(rows[0]?.progress, 100);
  assert.equal(rows[0]?.status, 'Selesai');
});
