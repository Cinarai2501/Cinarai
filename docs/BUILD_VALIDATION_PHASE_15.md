# Build dan Validation - Fase 15

Tanggal: 2026-08-28

## Hasil

- `npm install --ignore-scripts`: berhasil. npm melaporkan 29 vulnerability
  dependency dan warning deprecation `glob`; tidak ada install error.
- `npm run lint`: **lulus**.
- `npm run typecheck`: **lulus**.
- `npm test`: **gagal 4 dari 15**. Dua test gagal karena runner `tsx` mencoba
  memuat PNG/SVG sebagai JavaScript; dua test auth gagal karena mismatch fixture
  `username` dan ekspektasi duplicate document. Test AI/router dan navigation
  yang berjalan lulus.
- `npm run prebuild`: **lulus**. Export PDF berhasil dan generated PNG komik
  1-3 menjadi non-empty.
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: **lulus** pada percobaan lengkap;
  51/51 halaman statis tergenerasi, route dinamis terdeteksi, dan optimasi
  produksi selesai.
- `npm run format:check`: gagal karena banyak file baseline belum sesuai Prettier;
  tidak dilakukan formatting massal yang tidak terkait fase ini.

## Smoke Test Runtime

Dengan server production/dev yang tersedia:

- `/`, `/auth/login`, `/comic/1`, dan `/comic/1/cover` mengembalikan HTTP 200.
- PDF canonical dan generated image mengembalikan HTTP 200 dengan ukuran non-zero.
- URL asset berversi mengembalikan `Cache-Control: public, max-age=31536000,
  immutable`.
- URL asset legacy tanpa versi tetap mengembalikan `no-cache,
  must-revalidate`.
- Pemeriksaan filesystem memastikan 6 PDF, cover, thumbnail, dan 3 generated
  observation image canonical tersedia serta non-empty.
- `scripts/check-env.js` menemukan seluruh variabel Firebase client/admin yang
  diperlukan.

## Batasan

E2E `e2e/reset.spec.ts` tidak dijalankan karena bersifat destruktif terhadap
progress dan membutuhkan test user/Firebase data khusus. Tidak ada integration
script non-destruktif yang terdaftar di `package.json`. Upload, authentication,
dan Firestore membutuhkan credential serta fixture integration terisolasi; tidak
boleh disimpulkan lulus hanya dari compile atau smoke route publik.