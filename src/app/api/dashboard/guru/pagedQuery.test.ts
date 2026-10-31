import test from 'node:test';
import assert from 'node:assert/strict';
import { readAllPages } from './pagedQuery';

test('reads every roster item in bounded pages without dropping the final page', async () => {
  const source = Array.from({ length: 7 }, (_, index) => `student-${index + 1}`);
  const requests: Array<{ cursor: string | undefined; limit: number }> = [];
  const students = await readAllPages<string>(async (cursor, limit) => {
    requests.push({ cursor, limit });
    const cursorIndex = cursor ? source.indexOf(cursor) + 1 : 0;
    return source.slice(cursorIndex, cursorIndex + limit);
  }, 3);

  assert.deepEqual(students, source);
  assert.deepEqual(requests, [
    { cursor: undefined, limit: 3 },
    { cursor: 'student-3', limit: 3 },
    { cursor: 'student-6', limit: 3 },
  ]);
});

test('rejects invalid page sizes instead of silently returning partial results', async () => {
  await assert.rejects(() => readAllPages(async () => [], 0), RangeError);
});

test('propagates page failures instead of returning incomplete roster statistics', async () => {
  let page = 0;
  await assert.rejects(
    () => readAllPages(async () => {
      page += 1;
      if (page === 1) return ['student-1', 'student-2'];
      throw new Error('page read failed');
    }, 2),
    /page read failed/,
  );
});
