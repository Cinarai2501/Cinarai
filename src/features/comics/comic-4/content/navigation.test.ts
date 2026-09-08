import assert from 'node:assert/strict';
import test from 'node:test';
import { packageContent } from './packageContent';
import { resolveNavigationStageContent } from '@/features/learning-engine/components/stages/navigationStageContent';

test('comic 4 navigation exposes only its three PDF QR destinations in order', () => {
  assert.deepEqual(
    packageContent.qrCode.map((item) => ({ label: item.label, type: item.type, url: item.url, page: item.page })),
    [
      { label: 'AR Jembatan Merah Surabaya', type: 'AR', url: 'https://asblr.com/uL6tfC', page: 3 },
      { label: 'AR Hasil Pengukuran Jembatan', type: 'AR', url: 'https://asblr.com/mkyfiC', page: 14 },
      { label: 'Kuis Jembatan Merah', type: 'QUIZ', url: 'https://app.quizwhizzer.com/play?code=35733', page: 20 },
    ],
  );

  assert.equal(packageContent.learningObjects.length, 0);
  assert.equal(packageContent.model3D.length, 0);
  assert.match(packageContent.qrCode[1].description, /Hanan 60 langkah/);
  assert.match(packageContent.qrCode[1].description, /Hilya 76 langkah/);
  assert.match(packageContent.qrCode[1].description, /Aisyah 83 langkah/);
});

test('comic 4 navigation resolver does not use another comic QR fallback', () => {
  const content = resolveNavigationStageContent(4);

  assert.deepEqual(content.objects, []);
  assert.equal(content.heroQrImage, '');
  assert.equal(content.heroModelEntry, undefined);
});