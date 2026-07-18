import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDashboardPayload, type SafeGuruDashboardApiResponse } from './dashboardApiUtils';

test('normalizeDashboardPayload handles null body and returns safe defaults', () => {
  const normalized = normalizeDashboardPayload(null);
  assert.equal(Array.isArray(normalized.students), true);
  assert.equal(normalized.students.length, 0);
  assert.equal(Array.isArray(normalized.comics), true);
  assert.equal(normalized.comics.length, 0);
  assert.equal(normalized.stats?.totalStudents, 0);
  assert.equal(normalized.stats?.averageProgress, 0);
});

test('normalizeDashboardPayload preserves per-collection errors without throwing', () => {
  const payload: Partial<SafeGuruDashboardApiResponse> = {
    errors: { comics: 'Failed to load comics' },
    comics: [],
  };
  const normalized = normalizeDashboardPayload(payload);
  assert.equal(normalized.errors?.comics, 'Failed to load comics');
  assert.equal(Array.isArray(normalized.comics), true);
  assert.equal(normalized.comics.length, 0);
});

test('normalizeDashboardPayload with empty object returns safe stats and arrays', () => {
  const normalized = normalizeDashboardPayload({} as Partial<SafeGuruDashboardApiResponse>);
  assert.equal(Array.isArray(normalized.students), true);
  assert.equal(Array.isArray(normalized.progressDocuments), true);
  assert.equal(normalized.stats?.totalModules, 0);
  assert.equal(normalized.generatedAt === undefined || typeof normalized.generatedAt === 'string', true);
});
