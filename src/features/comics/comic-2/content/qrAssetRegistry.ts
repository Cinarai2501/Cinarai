const qrAssets: Record<string, string> = {
  Persegi: '/assets/qr/komik-2/13-objek-1.jpeg',
  'Persegi Panjang': '/assets/qr/komik-2/15-objek-2.jpeg',
  Segitiga: '/assets/qr/komik-2/17-objek-3.jpeg',
  'Belah Ketupat': '/assets/qr/komik-2/18-objek-4.jpeg',
};

export function getComic2QrAssetForObject(objectTitle: string): string | undefined {
  return qrAssets[objectTitle];
}
