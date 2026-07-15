import assert from 'node:assert/strict';
import test from 'node:test';

import { getComicModule } from '@/features/comics';

test('comic 1 navigation content exposes sketchfab and assemblr object data with QR and AI context', () => {
  const comicModule = getComicModule(1);
  const kubus = comicModule.navigation.learningObjects.find((object) => object.title === 'Kubus');
  const limas = comicModule.navigation.learningObjects.find((object) => object.title === 'Limas Segi Empat');
  const kerucut = comicModule.navigation.learningObjects.find((object) => object.title === 'Kerucut');

  assert.ok(kubus, 'Kubus object should exist in comic 1 navigation content');
  assert.match((kubus?.provider ?? '').toLowerCase(), /sketchfab/);
  assert.ok(kubus?.embedUrl?.includes('sketchfab'));
  assert.ok(kubus?.qrImage);
  assert.match(kubus?.aiPrompt ?? '', /kubus/i);

  assert.ok(limas, 'Limas Segi Empat object should exist in comic 1 navigation content');
  assert.match((limas?.provider ?? '').toLowerCase(), /assemblr/);
  assert.match((limas?.modelUrl ?? '').toLowerCase(), /asblr|assemblr/);
  assert.ok(limas?.qrImage);
  assert.match(limas?.aiPrompt ?? '', /limas/i);
  assert.match(limas?.navImage ?? '', /ornamentcandi/i);

  assert.ok(kerucut, 'Kerucut object should exist in comic 1 navigation content');
  assert.match(kerucut?.navImage ?? '', /puncakcandi/i);
});
