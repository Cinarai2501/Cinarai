import test from 'node:test';
import assert from 'node:assert/strict';

import { COMICS } from './comics';

for (const comicId of [4, 5, 6]) {
  test(`comic ${comicId} exposes a complete learning intro contract`, () => {
    const comic = COMICS.find((entry) => entry.id === comicId);

    assert.ok(comic, `comic ${comicId} should exist`);
    assert.ok(comic!.title.trim().length > 0, `comic ${comicId} title is required`);
    assert.ok(comic!.subtitle.trim().length > 0, `comic ${comicId} subtitle is required`);
    assert.ok(comic!.lokasi.trim().length > 0, `comic ${comicId} location is required`);
    assert.ok(comic!.learningTargets.length > 0, `comic ${comicId} learningTargets must not be empty`);
    assert.ok(comic!.characters.length > 0, `comic ${comicId} characters must not be empty`);
    assert.ok(comic!.synopsis.trim().length > 0, `comic ${comicId} synopsis is required`);
    assert.ok(comic!.cover.trim().length > 0, `comic ${comicId} cover is required`);
    assert.ok(comic!.pdfPath?.trim().length, `comic ${comicId} pdfPath is required`);
  });
}
