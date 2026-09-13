import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { packageContent } from './packageContent';

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