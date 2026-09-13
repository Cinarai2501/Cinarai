import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { packageContent } from './packageContent';
import { resolveNavigationStageContent, resolveObjectDetailContent } from '@/features/learning-engine/components/stages/navigationStageContent';

test('Komik 5 identification contains only its nine bangun datar', () => {
  const question = packageContent.identification.questions[0];
  const expectedShapes = [
    'Segitiga',
    'Segitiga Sama Kaki',
    'Segitiga Sama Sisi',
    'Segitiga Siku-Siku',
    'Persegi',
    'Persegi Panjang',
    'Trapesium',
    'Belah Ketupat',
    'Lingkaran',
  ];

  assert.ok(question);
  assert.deepEqual(question.options.map((option) => option.text).sort(), expectedShapes.sort());
  assert.ok(question.options.every((option) => option.correct));
  for (const filename of [
    'segitiga.svg',
    'segitiga-sama-kaki.svg',
    'segitiga-sama-sisi.svg',
    'segitiga-siku-siku.svg',
    'persegi.svg',
    'persegi-panjang.svg',
    'trapesium.svg',
    'belah-ketupat.svg',
    'lingkaran.svg',
  ]) {
    assert.equal(fs.existsSync(path.join(__dirname, '../assets/identification', filename)), true);
  }
  assert.equal(packageContent.qrCode.length, 0);
  assert.equal(packageContent.model3D.length, 0);
});

test('Komik 5 navigation is observation-only without AR or QR actions', () => {
  const content = resolveNavigationStageContent(5);

  assert.deepEqual(content.objects.map((object) => object.title), ['Atap', 'Jendela', 'Roda Meriam', 'Lantai']);
  assert.equal(content.heroModelEntry, undefined);
  assert.equal(content.heroQrImage, '');

  const detail = resolveObjectDetailContent(5, 'komik5-atap');
  assert.equal(detail.qrImage, '');
  assert.equal(detail.modelUrl, '');
});