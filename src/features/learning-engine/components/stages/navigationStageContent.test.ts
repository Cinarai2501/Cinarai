import test from 'node:test';
import assert from 'node:assert/strict';
import { packageContent } from '@/features/comics/comic-2/content/packageContent';
import qrUmpang from '@/features/comics/comic-2/assets/qr/umpang.png';
import navUmpang from '@/features/comics/comic-2/assets/navigation/umpang.png';
import { resolveNavigationStageContent, resolveModelActionUrl, resolveObjectDetailContent } from './navigationStageContent';
import { resolveComic2ObjectByScanValue } from '@/features/comics/comic-2/content/qrAssetRegistry';

test('comic 2 navigation content uses story objects and bangun datar language', () => {
  const titles = packageContent.learningObjects.map((object) => object.title);

  assert.ok(titles.includes('Umpang'));
  assert.ok(titles.includes('Balai Agung'));
  assert.ok(titles.includes('Candi Angka'));
  assert.ok(titles.includes('Candi Induk'));
  assert.ok(titles.includes('Pendopo'));
  assert.ok(titles.includes('Relief Candi'));
  assert.ok(packageContent.learningObjects.every((object) => object.description.toLowerCase().includes('candi') || object.description.toLowerCase().includes('simetri') || object.description.toLowerCase().includes('bangun datar')));
});

test('comic 2 navigation content uses only bangun datar terminology', () => {
  const objectNames = packageContent.learningObjects.map((object) => object.shapeName).filter(Boolean);

  assert.deepEqual(objectNames, ['Persegi Panjang', 'Persegi Panjang', 'Segitiga', 'Persegi Panjang', 'Persegi Panjang', 'Persegi Panjang']);
  assert.ok(packageContent.aiPrompt.navigation.includes('bangun datar'));
});

test('comic 2 content uses the official comic asset structure instead of public asset paths', () => {
  assert.ok(!packageContent.metadata.cover.includes('/assets/images/komik-2'));
  assert.ok(!packageContent.metadata.thumbnail.includes('/assets/images/komik-2'));
  assert.ok(packageContent.learningObjects.every((object) => !(object.navImage ?? '').includes('/assets/images/komik-2')));
  assert.ok(packageContent.learningObjects.every((object) => !(object.objectImage ?? '').includes('/assets/images/komik-2')));
});

test('comic 2 navigation stage resolves hero content from the comic 2 dataset only', () => {
  const content = resolveNavigationStageContent(2);
  const objectTitles = content.objects.map((object) => object.title);

  assert.deepEqual(objectTitles, [
    'Umpang',
    'Balai Agung',
    'Candi Angka',
    'Candi Induk',
    'Pendopo',
    'Relief Candi',
  ]);
  assert.equal(content.heroModelEntry?.title, 'Umpang');
  assert.equal(content.heroQrImage, qrUmpang.src);
  assert.equal(content.heroIllustration, navUmpang.src);
  assert.ok(content.objects.every((object) => object.id.startsWith('komik2-')));
});

test('comic 2 model action URL prefers the direct Assemblr link', () => {
  const modelUrl = resolveModelActionUrl({
    model3DUrl: 'https://asblr.com/MmAMdg',
    modelUrl: '',
    embedUrl: '',
  });

  assert.equal(modelUrl, 'https://asblr.com/MmAMdg');
});

test('comic 2 object bundle ids stay aligned across learning object, qr, and model entries', () => {
  const objectIds = packageContent.learningObjects.map((object) => object.id);
  const qrIds = packageContent.qrCode.map((entry) => entry.id);
  const modelIds = packageContent.model3D.map((entry) => entry.id);

  assert.deepEqual(objectIds, qrIds);
  assert.deepEqual(objectIds, modelIds);
  assert.ok(objectIds.every((id) => typeof id === 'string' && id.startsWith('komik2-')));
});

test('comic 2 scan resolver maps QR values to the correct object', () => {
  const balaiAgungObject = resolveComic2ObjectByScanValue('balaiagung');
  const candiAngkaObject = resolveComic2ObjectByScanValue('candiangka');
  const pendopoObject = resolveComic2ObjectByScanValue('pendopo');

  assert.equal(balaiAgungObject?.title, 'Balai Agung');
  assert.equal(candiAngkaObject?.title, 'Candi Angka');
  assert.equal(pendopoObject?.title, 'Pendopo');
  assert.equal(resolveComic2ObjectByScanValue('unknown')?.id, undefined);
});

test('comic 2 object detail resolves correct model and qr for reported objects', () => {
  const snapshot = [
    { id: 'komik2-umpang', expectedModel: 'https://asblr.com/yvcuaW', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-umpang')?.qrImage },
    { id: 'komik2-balaiagung', expectedModel: 'https://asblr.com/yvcuaW', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-balaiagung')?.qrImage },
    { id: 'komik2-candiinduk', expectedModel: 'https://asblr.com/MmAMdg', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-candiinduk')?.qrImage },
    { id: 'komik2-candiangka', expectedModel: 'https://asblr.com/MmAMdg', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-candiangka')?.qrImage },
  ];

  for (const entry of snapshot) {
    const { object, qrImage, modelUrl } = resolveObjectDetailContent(2, entry.id);
    assert.equal(object?.id, entry.id, `expected object.id for ${entry.id}`);
    assert.equal(object?.title, packageContent.learningObjects.find((o) => o.id === entry.id)?.title, `expected title for ${entry.id}`);
    assert.equal(modelUrl, entry.expectedModel, `expected modelUrl for ${entry.id}`);
    assert.equal(qrImage, entry.expectedQr, `expected qrImage for ${entry.id}`);
  }
});
