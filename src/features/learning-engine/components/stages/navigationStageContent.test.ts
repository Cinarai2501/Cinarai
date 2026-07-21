import test from 'node:test';
import assert from 'node:assert/strict';
import { packageContent } from '@/features/comics/comic-2/content/packageContent';
import qr15 from '@/features/comics/comic-2/assets/qr/15-objek-2.jpeg';
import navUmpang from '@/features/comics/comic-2/assets/navigation/umpang.png';
import { resolveNavigationStageContent, resolveModelActionUrl, resolveObjectDetailContent } from './navigationStageContent';

test('comic 2 navigation content uses story objects and bangun datar language', () => {
  const titles = packageContent.learningObjects.map((object) => object.title);

  assert.ok(titles.includes('Umpang'));
  assert.ok(titles.includes('Bale Agung'));
  assert.ok(titles.includes('Candi Angka'));
  assert.ok(titles.includes('Mensir'));
  assert.ok(titles.includes('Relief Lingkaran'));
  assert.ok(titles.includes('Ornamen Belah Ketupat'));
  assert.ok(packageContent.learningObjects.every((object) => object.description.toLowerCase().includes('candi') || object.description.toLowerCase().includes('simetri') || object.description.toLowerCase().includes('bangun datar')));
});

test('comic 2 navigation content uses only bangun datar terminology', () => {
  const objectNames = packageContent.learningObjects.map((object) => object.shapeName).filter(Boolean);

  assert.deepEqual(objectNames, ['Persegi Panjang', 'Persegi Panjang', 'Segitiga Sama Kaki', 'Persegi', 'Lingkaran', 'Belah Ketupat']);
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
    'Bale Agung',
    'Candi Angka',
    'Mensir',
    'Relief Lingkaran',
    'Ornamen Belah Ketupat',
  ]);
  assert.equal(content.heroModelEntry?.title, 'Umpang');
  assert.equal(content.heroQrImage, qr15.src);
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

test('comic 2 object detail resolves correct model and qr for reported objects', () => {
  const snapshot = [
    { id: 'komik2-umpang', expectedModel: 'https://asblr.com/MmAMdg', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-umpang')?.qrImage },
    { id: 'komik2-bale-agung', expectedModel: 'https://asblr.com/yvcuaW', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-bale-agung')?.qrImage },
    { id: 'komik2-mensir', expectedModel: 'https://asblr.com/yvcuaW', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-mensir')?.qrImage },
    { id: 'komik2-candi-angka', expectedModel: 'https://asblr.com/ljcPsy', expectedQr: packageContent.learningObjects.find((o) => o.id === 'komik2-candi-angka')?.qrImage },
  ];

  for (const entry of snapshot) {
    const { object, qrImage, modelUrl } = resolveObjectDetailContent(2, entry.id);
    assert.equal(object?.id, entry.id, `expected object.id for ${entry.id}`);
    assert.equal(object?.title, packageContent.learningObjects.find((o) => o.id === entry.id)?.title, `expected title for ${entry.id}`);
    assert.equal(modelUrl, entry.expectedModel, `expected modelUrl for ${entry.id}`);
    assert.equal(qrImage, entry.expectedQr, `expected qrImage for ${entry.id}`);
  }
});
