# Perbaikan Cache Gambar dan PDF - Fase 14

Tanggal: 2026-08-28

## Akar Masalah

Asset lokal dan Firebase Storage dapat diganti pada URL yang sama. Browser/CDN
kemudian berhak menyajikan response lama. Repository tidak menggunakan service
worker atau Cache Storage aplikasi, sehingga invalidasi dilakukan melalui URL
asset dan header response.

## Implementasi

- `src/lib/imageUrl.ts` mempertahankan query yang sudah ada dan menambahkan
  `v=<versi>` secara deterministik.
- Comic Firestore menggunakan `updatedAt` sebagai versi stabil untuk cover,
  thumbnail, dan PDF. Fallback lokal menggunakan release version yang hanya
  berubah saat asset terkait berubah.
- `PdfReader` memberikan URL PDF berversi ke `PdfViewer`. Dengan demikian PDF
  baru memakai URL baru, sementara PDF yang tidak berubah mempertahankan cache.
- `PdfCoverCanvas` menggunakan URL PDF sebagai cache key; ketika versi URL
  berubah, cover hasil render juga memakai entry baru.
- PDF lokal dan generated PNG dengan query `v` menerima:
  `public, max-age=31536000, immutable`.
- URL PDF/generated tanpa versi tetap menerima `no-cache, must-revalidate` sebagai
  kompatibilitas untuk URL legacy yang belum memiliki mekanisme invalidasi.

## Perilaku yang Dijamin

- Asset baru tampil setelah metadata/version asset diperbarui.
- Asset yang tidak berubah dapat dilayani dari cache selama satu tahun.
- Tidak ada `Date.now()` atau timestamp render pada URL asset.
- Tidak ada service worker baru dan tidak ada perubahan pada perilaku offline/PWA.
- Cache immutable hanya diberikan pada URL yang membawa versi; URL yang sama
  tidak boleh menunjuk bytes berbeda tanpa menaikkan versi.

## Tanggung Jawab Deployment

Uploader wajib memperbarui `updatedAt` Firestore setelah mengganti object Storage
yang dipakai comic. Untuk fallback lokal, naikkan `LOCAL_IMAGE_VERSION` atau
`LOCAL_PDF_VERSION` hanya ketika file terkait berubah. Mengganti bytes tanpa
mengubah versi tidak dapat diinvalidasi oleh frontend.

## Validasi

- `npm run lint`: lulus.
- `npx --yes tsx --test src/lib/imageUrl.test.ts`: 2/2 lulus.
- `npm run typecheck`: masih gagal pada tiga error implicit `any` baseline di
  `src/app/api/dashboard/guru/route.ts`; tidak terkait perubahan cache.