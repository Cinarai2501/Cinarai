import assert from 'node:assert/strict';
import test from 'node:test';
import { readJsonResponse } from './readJsonResponse';

test('reports endpoint and status for non-JSON responses', async () => {
  const response = new Response('<html>Service unavailable</html>', {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  await assert.rejects(
    readJsonResponse(response, '/api/dashboard/guru'),
    /Endpoint \/api\/dashboard\/guru mengembalikan respons non-JSON \(HTTP 503; Content-Type: text\/html; charset=utf-8\)/,
  );
});

test('reports endpoint and status for empty responses', async () => {
  const response = new Response(null, {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(
    readJsonResponse(response, '/api/dashboard/guru/modules/1'),
    /Endpoint \/api\/dashboard\/guru\/modules\/1 mengembalikan body kosong \(HTTP 503; Content-Type: application\/json\)/,
  );
});

test('reports endpoint and status for malformed JSON responses', async () => {
  const response = new Response('{invalid', {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(
    readJsonResponse(response, '/api/dashboard/guru'),
    /Endpoint \/api\/dashboard\/guru mengembalikan JSON tidak valid \(HTTP 502; Content-Type: application\/json\)/,
  );
});

test('parses JSON media types including structured suffixes', async () => {
  const response = new Response('{"ok":true}', {
    status: 200,
    headers: { 'Content-Type': 'application/problem+json; charset=utf-8' },
  });

  assert.deepEqual(await readJsonResponse<{ ok: boolean }>(response, '/api/dashboard/guru'), { ok: true });
});
