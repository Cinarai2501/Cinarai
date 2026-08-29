# Cleanup - Fase 13

Tanggal: 2026-08-28
Status: selesai secara konservatif.

## Perubahan

### Dihapus

- `.env.example.bak`, backup konfigurasi yang tidak direferensikan.
- Enam salinan PNG cover komik 4 dan 5 di `src/features/comics/**/assets/cover`.
  File tersebut byte-identik dengan asset canonical di `public/comics/komik-4`
  dan `public/comics/komik-5`, serta tidak memiliki consumer aktif.
- Deklarasi direct `json-stable-stringify-without-jsonify` dan `lodash.merge`
  dari `devDependencies`. Keduanya tetap tersedia secara transitif melalui
  ESLint dan tidak dihapus dari dependency graph yang diperlukan.

### Tidak dihapus

Source orphan yang belum terbukti aman, route debug, script manual/QA, badge,
icon level non-`v2`, fallback data, dan aset publik legacy tetap dipertahankan.
Ketiadaan import statis saja tidak cukup untuk membuktikan bahwa file-file itu
tidak dipakai oleh URL publik, workflow manual, registry, atau deployment lama.

Tidak dilakukan refactor besar, penggabungan component/utility, atau perubahan
runtime yang tidak terkait langsung dengan cleanup dan pengurangan duplikasi.

## Validasi

- `npm install --package-lock-only --ignore-scripts`: lulus.
- `npm ls json-stable-stringify-without-jsonify lodash.merge --all`: keduanya
  terdeteksi di bawah `eslint` sebagai dependency transitif.
- Pencarian reference deleted artifacts: tidak ditemukan reference aktif.
- `npm run lint`: lulus.
- `npm run typecheck`: gagal pada tiga error baseline `implicit any` di
  `src/app/api/dashboard/guru/route.ts` pada callback `filter`/`map`; file itu
  tidak diubah oleh fase cleanup.