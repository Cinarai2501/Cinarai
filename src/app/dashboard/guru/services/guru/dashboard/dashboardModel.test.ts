import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuruDashboardSnapshot } from './dashboardModel';

test('builds an empty-state dashboard snapshot without crashing', () => {
  const snapshot = buildGuruDashboardSnapshot({
    students: [],
    comics: [],
    progressDocuments: [],
    activities: [],
    reflections: [],
  });

  assert.equal(snapshot.summary.totalStudents, 0);
  assert.equal(snapshot.summary.activeStudents, 0);
  assert.equal(snapshot.summary.totalModules, 0);
  assert.equal(snapshot.summary.averageProgress, 0);
  assert.deepEqual(snapshot.progressItems, [
    { label: 'Progress Kelas', value: 0 },
    { label: 'Modul Selesai', value: 0 },
    { label: 'Siswa Aktif', value: 0 },
  ]);
  assert.deepEqual(snapshot.modules, []);
  assert.deepEqual(snapshot.recentActivities, []);
});

test('handles missing collection data without crashing', () => {
  const snapshot = buildGuruDashboardSnapshot({
    students: undefined as never,
    comics: undefined as never,
    progressDocuments: undefined as never,
    activities: undefined as never,
    reflections: undefined as never,
  });

  assert.equal(snapshot.summary.totalStudents, 0);
  assert.equal(snapshot.summary.activeStudents, 0);
  assert.equal(snapshot.summary.totalModules, 0);
  assert.equal(snapshot.summary.averageProgress, 0);
  assert.deepEqual(snapshot.progressItems, [
    { label: 'Progress Kelas', value: 0 },
    { label: 'Modul Selesai', value: 0 },
    { label: 'Siswa Aktif', value: 0 },
  ]);
  assert.deepEqual(snapshot.modules, []);
  assert.deepEqual(snapshot.recentActivities, []);
});
