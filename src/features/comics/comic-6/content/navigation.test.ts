import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { navigation } from './navigation';
import { resolveNavigationStageContent } from '@/features/learning-engine/components/stages/navigationStageContent';

test('Komik 6 navigation contains exactly the four observed Masjid Al-Akbar locations', () => {
  assert.deepEqual(navigation.learningObjects.map((object) => object.title), [
    'Menara Masjid',
    'Kubah Masjid',
    'Ruang Utama',
    'Tempat Wudhu',
  ]);
  assert.deepEqual(navigation.learningObjects.map((object) => object.shapeName), [
    'Tabung',
    'Kerucut & Setengah Bola',
    'Balok',
    'Kubus',
  ]);
  assert.equal(navigation.qrCode.length, 0);
  assert.equal(navigation.model3D.length, 0);
  assert.deepEqual(navigation.learningObjects.map((object) => object.navImage), [
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'navigation', 'menaramasjid.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'navigation', 'kubahmasjid.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'navigation', 'ruangutama.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'navigation', 'tempatwudhu.png'),
  ]);
});

test('Komik 6 navigation assets exist and shared resolver exposes no QR or model', () => {
  for (const asset of ['menaramasjid.png', 'kubahmasjid.png', 'ruangutama.png', 'tempatwudhu.png']) {
    assert.equal(fs.existsSync(path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'navigation', asset)), true);
  }

  const content = resolveNavigationStageContent(6);
  assert.equal(content.objects.length, 4);
  assert.equal(content.heroModelEntry, undefined);
  assert.equal(content.heroQrImage, '');
});