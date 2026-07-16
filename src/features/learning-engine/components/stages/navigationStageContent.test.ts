import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNavigationStageContent } from './navigationStageContent';

test('resolveNavigationStageContent uses comic 2 data for the comic 2 navigation stage', () => {
  const content = resolveNavigationStageContent(2);

  assert.equal(content.comicModule.metadata.comicId, 2);
  assert.equal(content.objects[0]?.title, 'Persegi');
  assert.equal(content.heroModelEntry?.title, 'Persegi');
  assert.equal(content.heroQrImage, '/assets/qr/komik-2/13-objek-1.jpeg');
});

test('resolveNavigationStageContent keeps comic 1 data isolated from comic 2', () => {
  const comic1Content = resolveNavigationStageContent(1);
  const comic2Content = resolveNavigationStageContent(2);

  assert.equal(comic1Content.objects[0]?.title, 'Kubus');
  assert.equal(comic2Content.objects[0]?.title, 'Persegi');
  assert.notEqual(comic1Content.objects[0]?.title, comic2Content.objects[0]?.title);
});
